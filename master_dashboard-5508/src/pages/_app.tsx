import '@/styles/globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import type { AppProps } from 'next/app'
import { useState } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Não tentar novamente para erros 404
          if (error?.status === 404) return false
          // Tentar no máximo 3 vezes para outros erros
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }))

  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log do erro para monitoramento
    console.error('Erro global capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error, { extra: errorInfo })
      // Exemplo: LogRocket.captureException(error)
    }
  }

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            error: {
              duration: 6000,
              style: {
                background: '#dc2626',
                color: '#fff',
              },
            },
            success: {
              style: {
                background: '#059669',
                color: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}