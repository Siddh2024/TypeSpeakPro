import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { googleTokenPayloadSchema, normalizeError } from '@/lib/validation';

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
    loginWithGithub: () => Promise<void>;
    logout: () => void;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Checks if a JWT token's `exp` claim has passed.
 * Returns true if the token is expired or if exp is missing.
 */
function isTokenExpired(exp: number | undefined): boolean {
    if (exp === undefined || exp === null) return true;
    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= exp * 1000;
}

/**
 * Safely decodes and validates a Google JWT token.
 * Returns the validated payload or null if invalid/expired.
 */
function decodeAndValidateToken(token: string): { name: string; email: string; picture: string; sub: string } | null {
    try {
        const decoded: unknown = jwtDecode(token);
        const result = googleTokenPayloadSchema.safeParse(decoded);

        if (!result.success) {
            console.error("Token validation failed:", result.error.issues);
            return null;
        }

        if (isTokenExpired(result.data.exp)) {
            console.warn("Token has expired. Clearing session.");
            return null;
        }

        return {
            name: result.data.name,
            email: result.data.email,
            picture: result.data.picture,
            sub: result.data.sub,
        };
    } catch (error) {
        const normalized = normalizeError(error, "Failed to decode authentication token.");
        console.error("Token decode error:", normalized.message);
        return null;
    }
}

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
            try {
                const token = localStorage.getItem('google_token');
                if (token) {
                    const userData = decodeAndValidateToken(token);
                    if (!userData) {
                        // Token is invalid or expired — clean up
                        localStorage.removeItem('google_token');
                        return;
                    }

                    setUser(userData);

                    // Then fetch the real DB ID
                    const id = await fetchSupabaseUser(userData.email);
                    console.log("Supabase ID fetched for auto-login:", id);
                    if (id) {
                        setUser(prev => prev ? { ...prev, id } : null);
                    }
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
            const userData = decodeAndValidateToken(token);
            if (!userData) {
                toast.error("Invalid login token. Please try again.");
                return;
            }

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
            const normalized = normalizeError(error, "Login failed.");
            console.error("Login failed:", normalized.message);
            toast.error("Failed to login. Please try again.");
        }
    };

    const loginWithGithub = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo: window.location.origin + '/dashboard' },
        });
        if (error) toast.error('GitHub login failed. Please try again.');
    };

    // Handle Supabase OAuth session (e.g. after GitHub redirect)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const { id, email, user_metadata } = session.user;
                const userData: User = {
                    id,
                    name: user_metadata?.full_name ?? user_metadata?.user_name ?? email ?? '',
                    email: email ?? '',
                    picture: user_metadata?.avatar_url ?? '',
                    sub: id,
                };
                setUser(userData);
                closeLoginModal();
                try {
                    await supabase.from('users').upsert({
                        id,
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture,
                        google_sub: userData.sub,
                    }, { onConflict: 'email' });
                } catch (e) {
                    logAsyncError('auth.syncOAuthUser', e);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const logout = () => {
        setUser(null);
        localStorage.removeItem('google_token');
        supabase.auth.signOut();
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
            loginWithGithub,
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
