import tailwindcss from '@tailwindcss/vite'
import { DEFAULT_THEME } from './app/utils/themes'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/color-mode', '@nuxt/content'],

  colorMode: {
    preference: DEFAULT_THEME,
    fallback: DEFAULT_THEME,
    dataValue: 'theme',
    classPrefix: '',
    classSuffix: '',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        {
          rel: 'preload',
          href: '/fonts/DepartureMono-Regular.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
      ],
    },
  },
})
