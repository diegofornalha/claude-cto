import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <Card className="my-8 border-red-200 bg-red-50">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ocorreu um erro ao carregar este componente.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-300">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 text-xs text-red-700 dark:text-red-400 overflow-x-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button 
              variant="primary" 
              onClick={this.handleReset}
              className="mx-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;