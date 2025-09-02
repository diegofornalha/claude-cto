import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Senha de admin (em produção, isso deveria vir de um backend seguro)
const ADMIN_PASSWORD = 'admin123'; // Temporário - deve ser substituído por autenticação real

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar se há sessão salva no localStorage
    const savedAuth = localStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      setIsAdmin(true);
    }
  }, []);

  const login = async (password: string): Promise<boolean> => {
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      localStorage.setItem('adminAuth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('adminAuth');
  };

  const checkAuth = (): boolean => {
    return isAuthenticated && isAdmin;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      login,
      logout,
      checkAuth
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