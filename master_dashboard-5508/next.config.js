/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. Desabilitar swcMinify temporariamente para evitar problemas
  swcMinify: false,
  
  // 4. Configurar poweredByHeader para segurança
  poweredByHeader: false,
  
  // 5. Adicionar compress para otimização
  compress: true,
  
  // 6. Configurar generateBuildId para builds consistentes
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`
  },
  
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  images: {
    domains: [],
  },
  
  // 3. Adicionar opção onDemandEntries com maior timeout
  onDemandEntries: {
    // Período em ms que uma página permanece no servidor após ser renderizada
    maxInactiveAge: 60 * 1000,
    // Número de páginas que devem ser mantidas simultaneamente
    pagesBufferLength: 5,
  },
  
  // 2. Configuração webpack customizada para melhor resolução de módulos
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    try {
      // Melhorar resolução de módulos
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          os: false,
        },
        alias: {
          ...config.resolve.alias,
          '@': require('path').join(__dirname, 'src'),
        }
      }
      
      // Otimizações para desenvolvimento
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      
      // Otimizações de performance
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
          },
        },
      }
      
      return config
    } catch (error) {
      console.error('Erro na configuração do webpack:', error)
      return config
    }
  },
  
  // Configuração para desenvolvimento
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig