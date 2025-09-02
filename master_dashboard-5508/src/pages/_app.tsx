import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  // Effect para detectar tema inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return <Component {...pageProps} />
}

export default MyApp