import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import AdminLogin from './AdminLogin';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = true 
}) => {
  const { isAuthenticated, isAdmin, checkAuth } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    const isAuthed = checkAuth();
    setChecking(false);
    
    if (!isAuthed && requireAdmin) {
      // Usuário não está autenticado
      // Mostrar tela de login
    }
  }, [checkAuth, requireAdmin]);

  if (checking) {
    // Mostrar loading enquanto verifica autenticação
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    // Mostrar tela de login
    return <AdminLogin onSuccess={() => router.reload()} />;
  }

  // Usuário autenticado, mostrar conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;