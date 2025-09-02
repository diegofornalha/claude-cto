import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    
    // Log para debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Document getInitialProps executed for:', ctx.pathname)
    }
    
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="pt-BR" className="scroll-smooth">
        <Head>
          {/* Meta tags essenciais */}
          <meta charSet="UTF-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          
          {/* Meta tags de segurança */}
          <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" />
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="DENY" />
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
          
          {/* Meta tags para PWA */}
          <meta name="theme-color" content="#0066cc" />
          <meta name="application-name" content="Master Dashboard" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Master Dashboard" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#0066cc" />
          <meta name="msapplication-tap-highlight" content="no" />
          
          {/* Favicons */}
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Preconnect para performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Script para detecção de tema inicial - evita flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('theme');
                    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    
                    if (theme === 'dark' || (!theme && systemPrefersDark)) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } catch (e) {
                    console.warn('Erro ao aplicar tema:', e);
                  }
                })();
              `
            }}
          />
          
          {/* Script de fallback para erros de JavaScript */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.addEventListener('error', function(event) {
                  console.error('Global error caught:', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                    timestamp: new Date().toISOString()
                  });
                  
                  // Previne que erros quebrem completamente a aplicação
                  return false;
                });
                
                window.addEventListener('unhandledrejection', function(event) {
                  console.error('Unhandled promise rejection:', {
                    reason: event.reason,
                    promise: event.promise,
                    timestamp: new Date().toISOString()
                  });
                  
                  // Previne que promise rejections quebrem a aplicação
                  event.preventDefault();
                });
              `
            }}
          />
        </Head>
        
        <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
          {/* Fallback noscript */}
          <noscript>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textAlign: 'center',
              padding: '2rem',
              zIndex: 9999
            }}>
              <div style={{ 
                maxWidth: '400px',
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#1f2937'
                }}>
                  JavaScript necessário
                </h1>
                <p style={{ 
                  color: '#6b7280',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  Esta aplicação requer JavaScript para funcionar corretamente.
                </p>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#9ca3af'
                }}>
                  Por favor, habilite o JavaScript em seu navegador e recarregue a página.
                </p>
              </div>
            </div>
          </noscript>
          
          {/* Loading spinner inicial */}
          <div 
            id="initial-loader" 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9998
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `
            }} />
          </div>
          
          <Main />
          <NextScript />
          
          {/* Script para remover loading spinner após carregamento */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.addEventListener('DOMContentLoaded', function() {
                  setTimeout(function() {
                    var loader = document.getElementById('initial-loader');
                    if (loader) {
                      loader.style.opacity = '0';
                      loader.style.transition = 'opacity 0.3s ease';
                      setTimeout(function() {
                        loader.remove();
                      }, 300);
                    }
                  }, 100);
                });
              `
            }}
          />
          
          {/* Analytics e monitoramento podem ser adicionados aqui */}
          {process.env.NODE_ENV === 'production' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Monitoramento básico de performance
                  window.addEventListener('load', function() {
                    if ('performance' in window && 'navigation' in performance) {
                      var loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                      console.log('Page load time:', loadTime + 'ms');
                    }
                  });
                `
              }}
            />
          )}
        </body>
      </Html>
    )
  }
}

export default MyDocument