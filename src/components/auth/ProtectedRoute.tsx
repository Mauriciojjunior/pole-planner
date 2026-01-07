import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requiredTenantId?: string;
  requireApprovedTeacher?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredTenantId,
  requireApprovedTeacher = false,
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole, requiredTenantId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
