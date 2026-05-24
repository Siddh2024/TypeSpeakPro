import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import type { AsyncErrorMetadata } from '@/types/async';
import { logAsyncError, toUserSafeError } from '@/types/async';

interface User {
    id?: string; // Add ID from database
    name: string;
    email: string;
    picture: string;
    sub: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authError: AsyncErrorMetadata | null;
    retryAuth: () => void;
    login: (token: string) => void;
    logout: () => void;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<AsyncErrorMetadata | null>(null);
    const [authRetryKey, setAuthRetryKey] = useState(0);
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

    const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
    const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);
    const retryAuth = useCallback(() => {
        setAuthError(null);
        setAuthRetryKey(key => key + 1);
    }, []);

    // Helper to fetch Supabase ID
    const fetchSupabaseUser = async (email: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            if (error) throw error;
            return data?.id;
        } catch (error) {
            logAsyncError("auth.fetchSupabaseUser", error);
            return null;
        }
    }

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            setIsLoading(true);
            setAuthError(null);

            const timeout = new Promise<never>((_, reject) => {
                window.setTimeout(() => reject(new Error('Session restore timed out')), 8000);
            });

            try {
                await Promise.race([(async () => {
                    const token = localStorage.getItem('google_token');
                    if (!token) return;

                    const decoded: any = jwtDecode(token);
                    // Initial load from token
                    const initialUser = {
                        name: decoded.name,
                        email: decoded.email,
                        picture: decoded.picture,
                        sub: decoded.sub,
                    };
                    if (isMounted) setUser(initialUser);

                    // Then fetch the real DB ID
                    const id = await fetchSupabaseUser(decoded.email);
                    if (id) {
                        if (isMounted) setUser(prev => prev ? { ...prev, id } : null);
                    }
                })(), timeout]);
            } catch (error) {
                logAsyncError("auth.bootstrap", error);
                if (error instanceof Error && error.message !== 'Session restore timed out') {
                    localStorage.removeItem('google_token');
                    if (isMounted) setUser(null);
                } else if (isMounted) {
                    setAuthError(toUserSafeError(error, {
                        title: 'Could not restore your session',
                        message: 'Authentication is taking longer than expected. Retry to restore your session.',
                    }, {
                        recoveryHint: 'If this keeps happening, sign in again from the home page.',
                    }));
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [authRetryKey]);

    const login = async (token: string) => {
        try {
            const decoded: any = jwtDecode(token);
            const userData = {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
                sub: decoded.sub,
            };

            // Optimistic update
            setUser(userData);
            localStorage.setItem('google_token', token);

            toast.success("Successfully logged in!");
            closeLoginModal(); // Close modal on successful login

            // Sync with Supabase (Background)
            try {
                const { data, error } = await supabase
                    .from('users')
                    .upsert({
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture,
                        google_sub: userData.sub,
                    }, { onConflict: 'email' })
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    // Update state with the real ID from DB
                    setUser(prev => prev ? { ...prev, id: data.id } : null);
                }
            } catch (dbError) {
                logAsyncError("auth.syncUser", dbError);
                toast.warning("Signed in, but profile sync needs a retry before saving progress.");
                // We don't block login if DB fails, but user won't have ID for saving results
            }

        } catch (error) {
            logAsyncError("auth.login", error);
            toast.error("Failed to login. Please try again.");
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('google_token');
        toast.info("Logged out successfully.");
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            authError,
            retryAuth,
            login,
            logout,
            isLoginModalOpen,
            openLoginModal,
            closeLoginModal
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
