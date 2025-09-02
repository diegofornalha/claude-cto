import type { AppProps } from 'next/app'
import Head from 'next/head'
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

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CTO Dashboard - Admin Panel</title>
      </Head>
      <Component {...pageProps} />
    </>)
}

export default MyApp