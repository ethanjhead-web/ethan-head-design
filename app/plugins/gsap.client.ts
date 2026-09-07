import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

export default defineNuxtPlugin({
  name: 'gsap',
  setup(nuxtApp) {
    nuxtApp.provide('gsap', gsap)
    nuxtApp.provide('Flip', Flip)
  },
})
