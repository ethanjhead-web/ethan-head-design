<script setup>
const { $gsap } = useNuxtApp()

useHead({
  titleTemplate: (title) => (title ? `${title} · Ethan Head` : 'Ethan Head'),
})

useSeoMeta({
  description:
    'Ethan Head is a graphic designer and developer working in branding, user interface design, front-end development and web animation.',
  ogSiteName: 'Ethan Head',
})

function createFlickerTimeline(el) {
  const flickers = Math.round($gsap.utils.random(1, 2))
  const tl = $gsap.timeline({ paused: true })

  for (let i = 0; i < flickers; i++) {
    tl.to(el, {
      autoAlpha: $gsap.utils.random(0.05, 0.1),
      duration: $gsap.utils.random(0.03, 0.08),
      ease: 'none',
    }).to(el, {
      autoAlpha: 1,
      duration: $gsap.utils.random(0.03, 0.08),
      ease: 'none',
    })
  }

  tl.to(el, { autoAlpha: 0, duration: 0, ease: 'power1.out' })

  return tl
}

function onLeave(el, done) {
  if (prefersReducedMotion()) return done()
  createFlickerTimeline(el).eventCallback('onComplete', done).play()
}

function onEnter(el, done) {
  if (prefersReducedMotion()) return done()
  const tl = createFlickerTimeline(el)
  // jump to the (invisible) end instantly — the correct starting point for
  // an entrance — before wiring up completion and reversing. Attaching
  // onComplete here instead would fire `done` immediately, since progress(1)
  // itself synchronously completes the timeline.
  tl.progress(1)
  tl.eventCallback('onReverseComplete', done)
  tl.reverse()
}
</script>

<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage
      :transition="{
        name: 'page',
        mode: 'out-in',
        css: false,
        onLeave,
        onEnter,
      }"
    />
  </NuxtLayout>
</template>
