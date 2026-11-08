import { gsap } from 'gsap'

export default defineNuxtPlugin({
  name: 'gsap',
  setup(nuxtApp) {
    nuxtApp.provide('gsap', gsap)
  },
})
