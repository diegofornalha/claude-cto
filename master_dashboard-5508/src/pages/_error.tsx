import { NextPageContext } from 'next'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  statusCode?: number
  hasGetInitialPropsRun?: boolean
  err?: Error
}

function ErrorPage({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  const getErrorMessage = (statusCode?: number) => {
    switch (statusCode) {
      case 404:
        return {
          title: 'Página não encontrada',
          description: 'A página que você está procurando não existe ou foi movida.',
          suggestion: 'Verifique se o endereço está correto ou volte para a página inicial.'
        }
      case 500:
        return {
          title: 'Erro interno do servidor',
          description: 'Ocorreu um erro interno no servidor.',
          suggestion: 'Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'
        }
      case 403:
        return {
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar esta página.',
          suggestion: 'Verifique se você está logado com as credenciais corretas.'
        }
      case 502:
      case 503:
      case 504:
        return {
          title: 'Serviço indisponível',
          description: 'O serviço está temporariamente indisponível.',
          suggestion: 'Tente novamente em alguns instantes.'
        }
      default:
        return {
          title: statusCode ? `Erro ${statusCode}` : 'Erro inesperado',
          description: 'Ocorreu um erro inesperado na aplicação.',
          suggestion: 'Tente recarregar a página ou volte para a página inicial.'
        }
    }
  }

  const errorInfo = getErrorMessage(statusCode)
  const isClientSideError = !statusCode || statusCode >= 400

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Ícone do erro */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          {/* Título e descrição */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {errorInfo.title}
            </h1>
            
            <p className="text-gray-600 mb-4">
              {errorInfo.description}
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              {errorInfo.suggestion}
            </p>

            {/* Detalhes técnicos (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (err || statusCode) && (
              <details className="mb-6 text-left bg-gray-100 p-4 rounded border">
                <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2">
                  Detalhes técnicos (desenvolvimento)
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  {statusCode && (
                    <div>
                      <strong>Status Code:</strong> {statusCode}
                    </div>
                  )}
                  {err?.message && (
                    <div>
                      <strong>Erro:</strong> {err.message}
                    </div>
                  )}
                  {err?.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {err.stack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <strong>Client-side:</strong> {isClientSideError ? 'Sim' : 'Não'}
                  </div>
                </div>
              </details>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Início
              </Link>
              
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
            </div>

            {/* Link de suporte */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Problema persistindo?{' '}
                <a 
                  href="mailto:suporte@exemplo.com" 
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Entre em contato com o suporte
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com informações do erro */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          Código do erro: {statusCode || 'UNKNOWN'} | 
          Timestamp: {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  
  // Log do erro no servidor
  if (err) {
    console.error('Error page: ', err)
  }

  return { statusCode, hasGetInitialPropsRun: true, err }
}

export default ErrorPage