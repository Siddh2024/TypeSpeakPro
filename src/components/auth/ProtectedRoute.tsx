import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState, RetryPanel } from '@/components/async';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, authError, retryAuth, openLoginModal } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            openLoginModal();
        }
    }, [isLoading, isAuthenticated, openLoginModal]);

    if (isLoading) {
        return (
            <LoadingState
                fullPage
                title="Restoring your session"
                description="Checking your sign-in before opening this workspace."
            />
        );
    }

    if (authError) {
        return (
            <div className="min-h-screen bg-background p-6 pt-28 text-foreground">
                <div className="mx-auto max-w-lg">
                    <RetryPanel error={authError} onRetry={retryAuth} />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
