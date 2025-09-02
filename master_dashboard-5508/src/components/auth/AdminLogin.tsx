import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Stack } from '../ui/Stack';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(password);
      if (success) {
        onSuccess?.();
      } else {
        setError('Senha incorreta. Tente novamente.');
        setPassword('');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Área Administrativa
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Digite a senha de administrador para continuar
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Stack spacing="md">
                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha de Admin
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha"
                    required
                    autoFocus
                    className="
                      w-full px-3 py-2
                      border border-gray-300 dark:border-gray-600
                      rounded-lg
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      transition-colors
                    "
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  {isLoading ? 'Autenticando...' : 'Entrar'}
                </Button>

                <div className="text-center">
                  <a 
                    href="/" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Voltar ao Dashboard
                  </a>
                </div>
              </Stack>
            </form>
          </CardBody>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dica: Use "admin123" como senha temporária
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;