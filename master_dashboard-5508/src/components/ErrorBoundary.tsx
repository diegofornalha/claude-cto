import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para debugging
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
    
    // Armazena informações do erro no state
    this.setState({
      error,
      errorInfo
    })

    // Callback personalizado para tratamento de erro
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Em produção, você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error, { extra: errorInfo })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Se foi fornecido um fallback customizado, use-o
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI de fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado na aplicação. Você pode tentar novamente ou recarregar a página.
            </p>

            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left bg-gray-100 p-3 rounded border">
                <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                  <strong>Erro:</strong> {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      <br /><br />
                      <strong>Stack:</strong>
                      <br />
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      <br /><br />
                      <strong>Componente Stack:</strong>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
              
              <button
                onClick={this.handleReload}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Recarregar Página
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Se o problema persistir, entre em contato com o suporte.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Hook para usar em componentes funcionais para disparar erro manualmente
export const useErrorHandler = () => {
  const [, setError] = React.useState()
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}

// Componente wrapper para usar com Suspense
export const ErrorBoundaryWrapper: React.FC<{
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}> = ({ children, fallback, onError }) => (
  <ErrorBoundary fallback={fallback} onError={onError}>
    {children}
  </ErrorBoundary>
)