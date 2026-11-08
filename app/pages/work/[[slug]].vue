<script setup>
// force Vue to reuse this component instance across /work <-> /work/:slug
// navigations instead of remounting — a remount would tear down the tile
// element Flip needs to read bounds from before it can morph into the panel,
// and would also (incorrectly) trigger the global page transition.
definePageMeta({ key: 'work' })

const route = useRoute()
const { $gsap, $playSfx } = useNuxtApp()

const { data: rawProjects } = await useAsyncData('work-projects', () =>
  queryCollection('work').order('order', 'ASC').all(),
  { default: () => [] },
)

const { init: initProgress, markOpened, isOpened } = useWorkProgress()

function slugOf(project) {
  return project.path.replace('/work/', '')
}

// paths never change after fetch, so the slug only needs computing once per
// project rather than repeatedly (several times per project) on every render
const projects = computed(() => rawProjects.value.map((p) => ({ ...p, slug: slugOf(p) })))

const activeSlug = computed(() => route.params.slug || null)
const activeProject = computed(() => projects.value.find((p) => p.slug === activeSlug.value))

useSeoMeta({
  title: () => (activeProject.value ? `${activeProject.value.title} — Work` : 'Work'),
  description: () =>
    activeProject.value?.description ??
    'From construction to aquaculture to Mexican baseball, I have done it all.',
  ogType: () => (activeProject.value ? 'article' : 'website'),
})

const nonSecretProjects = computed(() => projects.value.filter((p) => !p.secret))
const openedNonSecretCount = computed(
  () => nonSecretProjects.value.filter((p) => isOpened(p.slug)).length,
)
const secretUnlocked = computed(
  () => nonSecretProjects.value.length > 0 && openedNonSecretCount.value >= nonSecretProjects.value.length,
)

function isLocked(project) {
  return project.secret && !secretUnlocked.value
}

// Unknown slugs 404 (otherwise every tile would be `inert`), and a locked
// secret project can't be reached by typing its URL.
function routeProblem() {
  if (!activeSlug.value) return null
  if (!activeProject.value) return 'missing'
  if (isLocked(activeProject.value)) return 'locked'
  return null
}

const initialProblem = routeProblem()
if (initialProblem === 'missing') {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}
if (initialProblem === 'locked') {
  await navigateTo('/work', { replace: true })
}

// this page instance is reused across /work navigations (see definePageMeta
// above), so setup alone wouldn't catch client-side ones
watch(activeSlug, () => {
  const problem = routeProblem()
  if (problem === 'missing') showError({ statusCode: 404, statusMessage: 'Project not found' })
  else if (problem === 'locked') navigateTo('/work', { replace: true })
})

const secretRevealedThisSession = ref(false)

onMounted(() => {
  initProgress()
  // don't replay the reveal sound for something already unlocked in a
  // previous session — must happen synchronously, before the watcher below
  // ever gets a chance to flush, since computed values update immediately
  if (secretUnlocked.value) secretRevealedThisSession.value = true

  // count a project as opened however the visitor got there (tile click,
  // direct link, browser back/forward), not only via the close button
  watch(activeProject, (project) => {
    if (project && !isLocked(project)) markOpened(project.slug)
  }, { immediate: true })
})

// play the reveal once the visitor is back on the grid, where they can see
// the lock open, rather than while the last project's panel covers it
watch([secretUnlocked, activeSlug], ([unlocked, slug]) => {
  if (unlocked && slug === null && !secretRevealedThisSession.value) {
    secretRevealedThisSession.value = true
    $playSfx('reveal')
  }
})

// Flip animates width/height as a single transform, so it can't stagger
// them — height-then-width (a CRT-power-on-style bloom) is built by hand
// instead. The key to avoiding any flash/jump: pin the element to its
// starting box with inline styles (higher precedence than the CSS classes)
// BEFORE ever navigating, so the "open"/"closed" class swap that
// navigation triggers never gets a chance to render unpinned, even for a
// frame. The <article> wrapper never changes size (only its child's
// positioning scheme does), so its rect is always a reliable "natural
// closed size" to measure against, even mid-animation.
function measureRelativeTo(el, container) {
  const r = el.getBoundingClientRect()
  const c = container.getBoundingClientRect()
  return { left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height }
}

function afterTween(tween) {
  return new Promise((resolve) => tween.eventCallback('onComplete', resolve))
}

const mainRef = ref(null)

// per-slug wrapper elements, populated by :ref callbacks in the template.
// Cached per slug (rather than an inline arrow in the template) so the ref
// callback keeps the same identity across renders instead of being torn
// down and reattached on every reactive update.
const wrapperRefs = new Map()
const wrapperRefCallbacks = new Map()
function wrapperRefFor(slug) {
  if (!wrapperRefCallbacks.has(slug)) {
    wrapperRefCallbacks.set(slug, (el) => {
      if (el) wrapperRefs.set(slug, el)
      else wrapperRefs.delete(slug)
    })
  }
  return wrapperRefCallbacks.get(slug)
}

// open/close each run several awaited tweens; a second click mid-animation
// would start a competing sequence on the same elements
let animating = false

function withAnimationLock(fn) {
  return async (...args) => {
    if (animating) return
    animating = true
    try {
      await fn(...args)
    } finally {
      animating = false
    }
  }
}

function onTileClick(event, project) {
  // let modified clicks (new tab/window) behave like a normal link
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  openProject(project)
}

const openProject = withAnimationLock(async (project) => {
  const { slug } = project
  if (isLocked(project)) return
  if (prefersReducedMotion()) return navigateTo(`/work/${slug}`)

  const main = mainRef.value
  const wrapper = wrapperRefs.get(slug)
  const tileButton = wrapper.querySelector(':scope > .js-tile')
  const from = measureRelativeTo(wrapper, main)
  const mainRect = main.getBoundingClientRect()
  const to = { left: 0, top: 0, width: mainRect.width, height: mainRect.height }

  $gsap.set(wrapper, { position: 'absolute', zIndex: 20, left: from.left, top: from.top, width: from.width, height: from.height })

  // fade the tile's own content out completely first — nothing moves/grows
  // while it's still visible, so it can't look distorted by the resize
  await afterTween($gsap.to(tileButton, { opacity: 0, duration: 0.15 }))

  // phase 1: grow height (content already invisible, haven't navigated yet)
  await afterTween($gsap.to(wrapper, { top: to.top, height: to.height, duration: 0.25, ease: 'power2.inOut' }))

  await navigateTo(`/work/${slug}`)
  await nextTick()

  // wrapper's inline geometry survives the v-if content swap untouched, so
  // there's nothing to re-pin here
  const panelContent = wrapper.querySelectorAll('.js-panel-content')
  $gsap.set(panelContent, { opacity: 0 })

  // phase 2: grow width (content still invisible)
  await afterTween($gsap.to(wrapper, { left: to.left, width: to.width, duration: 0.25, ease: 'power2.inOut' }))

  $gsap.set(wrapper, { clearProps: 'position,zIndex,left,top,width,height' })

  // now that the box is fully sized, reveal the new content
  const tl = $gsap.timeline({ defaults: { ease: 'power2.inOut' } })
  tl.to(panelContent, { opacity: 1, duration: 0.2 })

  const actions = wrapper.querySelectorAll('.js-project-action')
  if (actions.length) {
    tl.fromTo(actions, { scale: 0 }, { scale: 1, duration: 0.2, ease: 'expo.inOut', stagger: -0.1 }, '<')
  }
})

const closeProject = withAnimationLock(async (project) => {
  const { slug } = project
  if (prefersReducedMotion()) return navigateTo('/work')

  const main = mainRef.value
  const wrapper = wrapperRefs.get(slug)
  const panelContent = wrapper.querySelectorAll('.js-panel-content')
  const actions = wrapper.querySelectorAll('.js-project-action')
  const from = measureRelativeTo(wrapper, main)
  // the <article> parent never leaves grid flow, so its rect is the tile's
  // natural closed size regardless of what the wrapper is currently pinned to
  const to = measureRelativeTo(wrapper.parentElement, main)

  $gsap.set(wrapper, { position: 'absolute', zIndex: 20, left: from.left, top: from.top, width: from.width, height: from.height })

  // fade the panel's own content out completely first
  const fadeOut = $gsap.timeline({ defaults: { duration: 0.15, ease: 'power1.in' } })
    .to(panelContent, { opacity: 0 }, 0)
  if (actions.length) fadeOut.to(actions, { scale: 0 }, 0)
  await afterTween(fadeOut)

  // phase 1: shrink width (content already invisible, haven't navigated yet)
  await afterTween($gsap.to(wrapper, { left: to.left, width: to.width, duration: 0.25, ease: 'power2.inOut' }))

  await navigateTo('/work')
  await nextTick()

  const tileButton = wrapper.querySelector(':scope > .js-tile')
  $gsap.set(tileButton, { opacity: 0 })

  // phase 2: shrink height (content still invisible)
  await afterTween($gsap.to(wrapper, { top: to.top, height: to.height, duration: 0.25, ease: 'power2.inOut' }))

  $gsap.set(wrapper, { clearProps: 'position,zIndex,left,top,width,height' })

  // now that the box is back to its resting size, reveal the tile again
  await afterTween($gsap.to(tileButton, { opacity: 1, duration: 0.2 }))
})
</script>

<template>
  <main id="work" ref="mainRef" class="max-lg:p-8 relative col-span-full row-span-full grid grid-cols-subgrid lg:h-full *:bg-(--color-bg) *:ring *:ring-black/50">
    <svg aria-hidden="true" class="absolute w-0 h-0 overflow-hidden" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <symbol id="icon-identity" viewBox="0 0 24 24">
          <title>Branding and Identity</title>
          <path d="M20.2153 8.16907H21.3078V18.0231H20.2153V8.16907Z"/>
          <path d="M20.2153 5.97687H21.3078V7.06937H20.2153V5.97687Z"/>
          <path d="M19.1228 18.0231H20.2153V20.2153H19.1228V18.0231Z"/>
          <path d="M19.1228 3.78467H20.2153V5.97686H19.1228V3.78467Z"/>
          <path d="M18.0231 13.6459H19.1228V16.9306H18.0231V13.6459Z"/>
          <path d="M18.0231 7.0694H19.1228V10.3541H18.0231V7.0694Z"/>
          <path d="M16.9306 16.9306H18.0231V19.1228H16.9306V16.9306Z"/>
          <path d="M16.9306 4.8844H18.0231V7.0694H16.9306V4.8844Z"/>
          <path d="M15.831 21.3078H16.9307V22.4075H15.831V21.3078Z"/>
          <path d="M15.831 8.16907H16.9307V15.8309H15.831V8.16907Z"/>
          <path d="M14.7385 3.78467H16.9307V4.88436H14.7385V3.78467Z"/>
          <path d="M15.831 1.59253H16.9307V2.69222H15.831V1.59253Z"/>
          <path d="M14.7385 19.1228H16.9307V20.2153H14.7385V19.1228Z"/>
          <path d="M14.7385 7.0694H15.831V8.16908H14.7385V7.0694Z"/>
          <path d="M13.6459 22.4075H15.8309V23.5H13.6459V22.4075Z"/>
          <path d="M13.6459 16.9306H14.7384V18.0231H13.6459V16.9306Z"/>
          <path d="M13.6459 12.5463H14.7384V14.7385H13.6459V12.5463Z"/>
          <path d="M13.6459 9.26157H14.7384V11.4538H13.6459V9.26157Z"/>
          <path d="M12.5463 2.6922H14.7385V3.7847H12.5463V2.6922Z"/>
          <path d="M9.26157 20.2153H14.7384V21.3078H9.26157V20.2153Z"/>
          <path d="M11.4538 8.16907H13.646V9.26157H11.4538V8.16907Z"/>
          <path d="M10.3541 14.7384H13.6459V15.8309H10.3541V14.7384Z"/>
          <path d="M11.4538 10.3541H12.5463V13.6459H11.4538V10.3541Z"/>
          <path d="M10.3541 4.8844H13.6459V5.9769H10.3541V4.8844Z"/>
          <path d="M10.3541 18.0231H13.6459V19.1228H10.3541V18.0231Z"/>
          <path d="M9.26157 2.6922H11.4538V3.7847H9.26157V2.6922Z"/>
          <path d="M8.16907 22.4075H11.4538V23.5H8.16907V22.4075Z"/>
          <path d="M9.26157 16.9306H10.3541V18.0231H9.26157V16.9306Z"/>
          <path d="M9.26157 10.3541H10.3541V14.7384H9.26157V10.3541Z"/>
          <path d="M8.16907 0.5H15.8309V1.5925H8.16907V0.5Z"/>
          <path d="M8.16907 7.0694H9.26157V8.16908H8.16907V7.0694Z"/>
          <path d="M7.0694 3.78467H9.26158V4.88436H7.0694V3.78467Z"/>
          <path d="M5.9769 21.3078H8.16909V22.4075H5.9769V21.3078Z"/>
          <path d="M7.0694 14.7384H8.16908V15.8309H7.0694V14.7384Z"/>
          <path d="M7.0694 11.4537H8.16908V13.6459H7.0694V11.4537Z"/>
          <path d="M7.0694 8.16907H8.16908V10.3541H7.0694V8.16907Z"/>
          <path d="M5.9769 16.9306H7.0694V19.1228H5.9769V16.9306Z"/>
          <path d="M5.9769 4.8844H7.0694V7.0694H5.9769V4.8844Z"/>
          <path d="M4.8844 20.2153H5.9769V21.3078H4.8844V20.2153Z"/>
          <path d="M4.8844 8.16907H5.9769V16.9306H4.8844V8.16907Z"/>
          <path d="M4.8844 2.6922H5.9769V3.7847H4.8844V2.6922Z"/>
          <path d="M3.7847 18.0231H4.88439V20.2153H3.7847V18.0231Z"/>
          <path d="M3.7847 3.78467H4.88439V5.97686H3.7847V3.78467Z"/>
          <path d="M2.6922 14.7384H3.7847V18.0231H2.6922V14.7384Z"/>
          <path d="M2.6922 5.97687H3.7847V13.6459H2.6922V5.97687Z"/>
        </symbol>

        <symbol id="icon-animation" viewBox="0 0 24 24">
          <title>Web-Based Animation</title>
          <path d="M21.8541 6.52313H22.9538V7.61563H21.8541V6.52313Z"/>
          <path d="M20.7616 7.61563H21.8541V8.71532H20.7616V7.61563Z"/>
          <path d="M20.7616 5.43063H21.8541V6.52313H20.7616V5.43063Z"/>
          <path d="M19.6691 6.52313H20.7616V7.61563H19.6691V6.52313Z"/>
          <path d="M19.6691 20.7616V19.6619H20.7616V18.5694H19.6691V17.4769H18.5694V18.5694H17.4769V19.6619H18.5694V20.7616H19.6691Z"/>
          <path d="M18.5694 9.80783H19.6691V12H18.5694V9.80783Z"/>
          <path d="M17.4769 12H18.5694V13.0925H17.4769V12Z"/>
          <path d="M17.4769 3.23846H18.5694V4.33096H17.4769V3.23846Z"/>
          <path d="M16.3772 13.0925H17.4769V14.1922H16.3772V13.0925Z"/>
          <path d="M16.3772 4.33096H17.4769V5.43065H16.3772V4.33096Z"/>
          <path d="M15.2847 14.1922H16.3772V15.2847H15.2847V14.1922Z"/>
          <path d="M15.2847 5.43063H16.3772V6.52313H15.2847V5.43063Z"/>
          <path d="M14.1922 15.2847H15.2847V16.3772H14.1922V15.2847Z"/>
          <path d="M14.1922 6.52313H15.2847V7.61563H14.1922V6.52313Z"/>
          <path d="M13.0925 21.8541H14.1922V22.9538H13.0925V21.8541Z"/>
          <path d="M13.0925 16.3772H14.1922V17.4769H13.0925V16.3772Z"/>
          <path d="M13.0925 7.61563V8.71532H12V9.80782H18.5694V8.71532H14.1922V7.61563H13.0925Z"/>
          <path d="M12 17.4769H13.0925V18.5694H12V17.4769Z"/>
          <path d="M18.5694 2.13876V3.23845H19.6691V1.04626H10.9075V2.13876H18.5694Z"/>
          <path d="M10.9075 18.5694H12V19.6619H10.9075V18.5694Z"/>
          <path d="M9.80782 19.6619H10.9075V20.7616H9.80782V19.6619Z"/>
          <path d="M9.80782 2.13876H10.9075V3.23845H9.80782V2.13876Z"/>
          <path d="M8.71532 20.7616H9.80782V21.8541H8.71532V20.7616Z"/>
          <path d="M9.80781 12H3.23843V13.0925H8.71531V15.2847H9.80781V12Z"/>
          <path d="M8.71532 3.23846H9.80782V4.33096H8.71532V3.23846Z"/>
          <path d="M7.61563 21.8541H8.71532V22.9538H7.61563V21.8541Z"/>
          <path d="M7.61563 15.2847H8.71532V18.5694H7.61563V15.2847Z"/>
          <path d="M7.61563 4.33096H8.71532V5.43065H7.61563V4.33096Z"/>
          <path d="M6.52313 18.5694H7.61563V21.8541H6.52313V18.5694Z"/>
          <path d="M6.52313 5.43063H7.61563V6.52313H6.52313V5.43063Z"/>
          <path d="M5.43062 6.52313H6.52312V7.61563H5.43062V6.52313Z"/>
          <path d="M4.33093 7.61563H5.43062V8.71532H4.33093V7.61563Z"/>
          <path d="M3.23843 16.3772H4.33093V17.4769H3.23843V16.3772Z"/>
          <path d="M3.23843 8.71533H4.33093V9.80783H3.23843V8.71533Z"/>
          <path d="M3.23844 1.04626V2.13876H2.14594V3.23845H3.23844V4.33095H4.33094V3.23845H5.43062V2.13876H4.33094V1.04626H3.23844Z"/>
          <path d="M2.14594 17.4769H3.23844V18.5694H2.14594V17.4769Z"/>
          <path d="M2.14594 15.2847H3.23844V16.3772H2.14594V15.2847Z"/>
          <path d="M2.14594 9.80783H3.23844V12H2.14594V9.80783Z"/>
          <path d="M1.04625 16.3772H2.14594V17.4769H1.04625V16.3772Z"/>
        </symbol>

        <symbol id="icon-ui-design" viewBox="0 0 24 24">
          <title>User Interface Design</title>
          <g><path d="m22.86 5.71875 -21.7125 0 0 -3.4275 -1.1475 0 0 19.424999999999997 1.1475 0 0 -14.857499999999998 21.7125 0 0 14.857499999999998 1.1400000000000001 0 0 -19.424999999999997 -1.1400000000000001 0 0 3.4275z"></path><path d="M1.1475 21.71625h21.7125v1.1400000000000001H1.1475Z"></path><path d="M19.4325 14.861250000000002h1.1400000000000001v3.4275h-1.1400000000000001Z"></path><path d="M18.285 18.28875h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M18.285 13.713750000000001h1.1475v1.1475h-1.1475Z"></path><path d="M14.857499999999998 19.42875h3.4275v1.1475h-3.4275Z"></path><path d="m18.285 13.713750000000001 0 -1.1400000000000001 -1.1400000000000001 0 0 -4.5675 -13.7175 0 0 6.855 2.2874999999999996 0 0 -1.1475 -1.1400000000000001 0 0 -4.5675 11.43 0 0 3.4275 -1.1475 0 0 1.1400000000000001 3.4275 0z"></path><path d="M13.7175 18.28875h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M13.7175 13.713750000000001h1.1400000000000001v1.1475h-1.1400000000000001Z"></path><path d="M12.57 14.861250000000002h1.1475v3.4275h-1.1475Z"></path><path d="M6.855 3.4312500000000004h1.1475v1.1400000000000001H6.855Z"></path><path d="m4.574999999999999 16.00125 0 1.1475 -1.1475 0 0 1.1400000000000001 8.0025 0 0 -3.4275 -1.1400000000000001 0 0 -1.1475 -1.1475 0 0 -1.1400000000000001 -1.1400000000000001 0 0 1.1400000000000001 -1.1475 0 0 1.1475 -1.1400000000000001 0 0 1.1400000000000001 -1.1400000000000001 0z"></path><path d="M4.574999999999999 3.4312500000000004h1.1400000000000001v1.1400000000000001H4.574999999999999Z"></path><path d="M2.2874999999999996 3.4312500000000004h1.1400000000000001v1.1400000000000001H2.2874999999999996Z"></path><path d="M1.1475 1.1437499999999998h21.7125v1.1475H1.1475Z"></path></g>
        </symbol>

        <symbol id="icon-development" viewBox="0 0 24 24">
          <title>Front-End Development</title>
          <path d="M22.4075 18.573H23.5V19.6655H22.4075V18.573Z"/>
          <path d="M23.5 10.9039V8.7117H22.4075V9.81139H21.3078V7.6192H20.2153V12.0036H19.1156V10.9039H18.0231V13.0961H20.2153V16.3808H14.7384V17.4805H23.5V16.3808H21.3078V10.9039H23.5Z"/>
          <path d="M21.3078 1.04984H23.5V2.14234H21.3078V1.04984Z"/>
          <path d="M19.1156 18.573H20.2153V19.6655H19.1156V18.573Z"/>
          <path d="M18.0231 3.24203H20.2153V4.33453H18.0231V3.24203Z"/>
          <path d="M14.7384 18.573H15.8309V19.6655H14.7384V18.573Z"/>
          <path d="M14.7384 7.61922H11.4538V8.71172H14.7384V9.81141H15.8309V4.33453H14.7384V7.61922Z"/>
          <path d="M10.3541 12.0036H8.16907V13.0961H10.3541V14.1886H8.16907V13.0961H7.06938V17.4805H10.3541V18.573H7.06938V19.6655H3.78469V20.7688H4.88438V22.9538H7.06938V21.8613H5.97688V20.7688H9.26157V19.6691H10.3541V20.7688H12.5463V19.6691H11.4538V15.2919H12.5463V16.3844H13.6459V14.1922H11.4538V10.9075H14.7384V9.815H10.3541V12.0036ZM10.3541 16.3808H8.16907V15.2883H10.3541V16.3808Z"/>
          <path d="M8.16906 1.04984H10.3541V2.14234H8.16906V1.04984Z"/>
          <path d="M7.06937 5.42703H8.16906V7.61922H7.06937V5.42703Z"/>
          <path d="M5.97688 3.24203H14.7384V4.33453H5.97688V3.24203Z"/>
          <path d="M5.97688 17.4805H7.06938V18.573H5.97688V17.4805Z"/>
          <path d="M4.88438 4.33453H5.97688V12.0036H4.88438V4.33453Z"/>
          <path d="M3.78469 12.0036H4.88438V15.2883H3.78469V12.0036Z"/>
          <path d="M2.69218 18.573H3.78468V19.6655H2.69218V18.573Z"/>
          <path d="M2.69218 15.2883H3.78468V16.3808H2.69218V15.2883Z"/>
          <path d="M1.5925 17.4805H2.69219V18.573H1.5925V17.4805Z"/>
          <path d="M0.5 4.33453H2.69219V5.42703H0.5V4.33453Z"/>
          <path d="M1.5925 15.2883H2.69219V14.1886H1.5925V13.0961H0.5V17.4805H1.5925V15.2883Z"/>
        </symbol>

        <symbol id="icon-secret" viewBox="0 0 24 24">
          <title>Secret</title>
          <path d="M21.3114 5.43066H22.4039V15.2847H21.3114V5.43066Z"/>
          <path d="M20.2189 15.2847H21.3114V16.3772H20.2189V15.2847Z"/>
          <path d="M20.2189 4.33093H21.3114V5.43062H20.2189V4.33093Z"/>
          <path d="M19.1192 16.3772H20.2189V17.4769H19.1192V16.3772Z"/>
          <path d="M19.1192 3.23846H20.2189V4.33096H19.1192V3.23846Z"/>
          <path d="M18.0267 17.4769H19.1192V21.8541H18.0267V17.4769Z"/>
          <path d="M18.0267 9.8078H15.8345V10.9003H14.742V13.0925H15.8345V14.1922H18.0267V13.0925H19.1192V10.9003H18.0267V9.8078Z"/>
          <path d="M16.927 2.13879H19.1192V3.23848H16.927V2.13879Z"/>
          <path d="M14.742 21.8541H18.0267V22.9538H14.742V21.8541Z"/>
          <path d="M13.6423 18.5694H14.742V21.8541H13.6423V18.5694Z"/>
          <path d="M10.3577 21.8541H13.6424V22.9538H10.3577V21.8541Z"/>
          <path d="M10.3577 15.2847H13.6424V16.3772H10.3577V15.2847Z"/>
          <path d="M9.26517 18.5694H10.3577V21.8541H9.26517V18.5694Z"/>
          <path d="M7.07297 1.04626H16.927V2.13876H7.07297V1.04626Z"/>
          <path d="M5.98047 21.8541H9.26516V22.9538H5.98047V21.8541Z"/>
          <path d="M8.16547 9.8078H5.98047V10.9003H4.88078V13.0925H5.98047V14.1922H8.16547V13.0925H9.26516V10.9003H8.16547V9.8078Z"/>
          <path d="M4.88078 2.13879H7.07297V3.23848H4.88078V2.13879Z"/>
          <path d="M4.88078 17.4769H5.98047V21.8541H4.88078V17.4769Z"/>
          <path d="M3.78828 16.3772H4.88078V17.4769H3.78828V16.3772Z"/>
          <path d="M3.78828 3.23846H4.88078V4.33096H3.78828V3.23846Z"/>
          <path d="M2.69579 15.2847H3.78829V16.3772H2.69579V15.2847Z"/>
          <path d="M2.69579 4.33093H3.78829V5.43062H2.69579V4.33093Z"/>
          <path d="M1.5961 5.43066H2.69579V15.2847H1.5961V5.43066Z"/>
        </symbol>

        <symbol id="icon-lock-closed" viewBox="0 0 24 24">
          <title>Lock Closed</title>
          <path d="M8 0H16V1H8V0Z"/>
          <path d="M7 2V1H8V2H7Z"/>
          <path d="M13 13H14V14H12V15H14V16H13V17H12.5V20H11.5V17H11V16H10V15H9V14H10V13H11V12H13V13Z"/>
          <path d="M14 15V14H15V15H14Z"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17 2V9H7V2H6V9H5V10H4V22H5V23H6V24H18V23H19V22H20V10H19V9H18V2H17ZM19 10V22H18V23H6V22H5V10H19Z"/>
          <path d="M17 2V1H16V2H17Z"/>
        </symbol>

        <symbol id="icon-lock-opened" viewBox="0 0 24 24">
          <title>Lock Opened</title>
          <path d="M14 0H22V1H14V0Z"/>
          <path d="M13 2V1H14V2H13Z"/>
          <path d="M14 13V14H12V15H14V16H13V17H12.5V20H11.5V17H11V16H10V15H9V14H10V13H11V12H13V13H14Z"/>
          <path d="M14 15V14H15V15H14Z"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19 10V9H13V2H12V9H5V10H4V22H5V23H6V24H18V23H19V22H20V10H19ZM19 10V22H18V23H6V22H5V10H19Z"/>
          <path d="M23 2H22V1H23V2Z"/>
          <path d="M23 2H24V9H23V2Z"/>
        </symbol>

        <symbol id="icon-hyperlink" viewBox="0 0 24 24">
          <title>Hyperlink</title>
          <g><path d="M22.86 9.14625H24v5.715h-1.1400000000000001Z"></path><path d="M21.7125 14.861250000000002h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M21.7125 7.998749999999999h1.1475v1.1475h-1.1475Z"></path><path d="M20.572499999999998 10.286249999999999h1.1400000000000001v3.4275h-1.1400000000000001Z"></path><path d="M14.857499999999998 16.00125h6.855v1.1400000000000001h-6.855Z"></path><path d="M14.857499999999998 6.85875h6.855v1.1400000000000001h-6.855Z"></path><path d="M13.7175 14.861250000000002h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="m16.005 13.713750000000001 0 1.1475 4.5675 0 0 -1.1475 -3.4275 0 0 -1.1400000000000001 1.1400000000000001 0 0 -1.1475 -1.1400000000000001 0 0 -1.1400000000000001 3.4275 0 0 -1.1400000000000001 -4.5675 0 0 1.1400000000000001 -2.2874999999999996 0 0 -1.1400000000000001 -1.1475 0 0 1.1400000000000001 -1.1400000000000001 0 0 -1.1400000000000001 -1.1400000000000001 0 0 1.1400000000000001 -2.2874999999999996 0 0 -1.1400000000000001 -4.574999999999999 0 0 1.1400000000000001 3.435 0 0 1.1400000000000001 -1.1475 0 0 1.1475 1.1475 0 0 1.1400000000000001 -3.435 0 0 1.1475 4.574999999999999 0 0 -1.1475 2.2874999999999996 0 0 1.1475 1.1400000000000001 0 0 -1.1475 1.1400000000000001 0 0 1.1475 1.1475 0 0 -1.1475 2.2874999999999996 0z"></path><path d="M13.7175 7.998749999999999h1.1400000000000001v1.1475h-1.1400000000000001Z"></path><path d="M9.1425 14.861250000000002h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M9.1425 7.998749999999999h1.1475v1.1475h-1.1475Z"></path><path d="M2.2874999999999996 16.00125h6.855v1.1400000000000001H2.2874999999999996Z"></path><path d="M2.2874999999999996 6.85875h6.855v1.1400000000000001H2.2874999999999996Z"></path><path d="M2.2874999999999996 10.286249999999999h1.1400000000000001v3.4275H2.2874999999999996Z"></path><path d="M1.1475 14.861250000000002h1.1400000000000001v1.1400000000000001H1.1475Z"></path><path d="M1.1475 7.998749999999999h1.1400000000000001v1.1475H1.1475Z"></path><path d="M0 9.14625h1.1475v5.715H0Z"></path></g>
        </symbol>

        <symbol id="icon-trophy" viewBox="0 0 24 24">
          <title>Trophy</title>
          <g><path d="M22.28625 4.005h1.1400000000000001v5.7075000000000005h-1.1400000000000001Z"></path><path d="m19.99875 4.005 2.2874999999999996 0 0 -1.1475 -2.2874999999999996 0 0 -1.1400000000000001 -1.1400000000000001 0 0 11.43 1.1400000000000001 0 0 -2.2874999999999996 2.2874999999999996 0 0 -1.1475 -2.2874999999999996 0 0 -5.7075000000000005z"></path><path d="M17.71125 13.1475h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M16.57125 14.287500000000001h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="m7.428749999999999 22.29 0 -1.1475 -1.1400000000000001 0 0 1.1475 -1.1475 0 0 1.1400000000000001 13.7175 0 0 -1.1400000000000001 -1.1475 0 0 -1.1475 -1.1400000000000001 0 0 1.1475 -9.1425 0z"></path><path d="M14.283750000000001 20.0025h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z"></path><path d="M14.283750000000001 15.4275h2.2874999999999996v1.1475h-2.2874999999999996Z"></path><path d="m13.143749999999999 6.285 0 -2.2800000000000002 -2.2874999999999996 0 0 2.2800000000000002 -3.4275 0 0 1.1475 1.1400000000000001 0 0 1.1400000000000001 1.1475 0 0 1.1400000000000001 -1.1475 0 0 2.2874999999999996 2.2874999999999996 0 0 -1.1400000000000001 2.2874999999999996 0 0 1.1400000000000001 2.2874999999999996 0 0 -2.2874999999999996 -1.1475 0 0 -1.1400000000000001 1.1475 0 0 -1.1400000000000001 1.1400000000000001 0 0 -1.1475 -3.4275 0z"></path><path d="M13.143749999999999 16.575000000000003h1.1400000000000001v3.4275h-1.1400000000000001Z"></path><path d="M9.71625 16.575000000000003h1.1400000000000001v3.4275h-1.1400000000000001Z"></path><path d="M7.428749999999999 20.0025h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z"></path><path d="M7.428749999999999 15.4275h2.2874999999999996v1.1475h-2.2874999999999996Z"></path><path d="M6.28875 14.287500000000001h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M5.14125 0.5700000000000001h13.7175v1.1475H5.14125Z"></path><path d="M5.14125 13.1475h1.1475v1.1400000000000001h-1.1475Z"></path><path d="m5.14125 1.7175 -1.1400000000000001 0 0 1.1400000000000001 -2.2874999999999996 0 0 1.1475 2.2874999999999996 0 0 5.7075000000000005 -2.2874999999999996 0 0 1.1475 2.2874999999999996 0 0 2.2874999999999996 1.1400000000000001 0 0 -11.43z"></path><path d="M0.57375 4.005h1.1400000000000001v5.7075000000000005H0.57375Z"></path></g>
        </symbol>

        <symbol id="icon-factory" viewBox="0 0 24 24">
          <title>Factory</title>
          <g><path d="M22.8525 6.85875H24v15.997499999999999h-1.1475Z"></path><path d="m22.8525 1.1437499999999998 -3.4275 0 0 5.715 1.1475 0 0 -4.574999999999999 1.1400000000000001 0 0 4.574999999999999 1.1400000000000001 0 0 -5.715z"></path><path d="M20.572499999999998 18.28875h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M20.572499999999998 13.713750000000001h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M20.572499999999998 9.14625h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="m18.285 9.14625 -2.2874999999999996 0 0 1.1400000000000001 2.2874999999999996 0 0 12.57 1.1400000000000001 0 0 -15.997499999999999 -1.1400000000000001 0 0 2.2874999999999996z"></path><path d="M15.997499999999999 2.28375h1.1475v1.1475h-1.1475Z"></path><path d="M14.857499999999998 13.713750000000001h2.2874999999999996v2.2874999999999996h-2.2874999999999996Z"></path><path d="M13.71 1.1437499999999998h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z"></path><path d="M13.71 10.286249999999999h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z"></path><path d="M11.43 18.28875h2.2800000000000002v2.2800000000000002h-2.2800000000000002Z"></path><path d="M11.43 11.42625h2.2800000000000002v1.1475h-2.2800000000000002Z"></path><path d="M11.43 2.28375h2.2800000000000002v1.1475h-2.2800000000000002Z"></path><path d="M10.2825 1.1437499999999998h1.1475v1.1400000000000001h-1.1475Z"></path><path d="m10.2825 9.14625 -2.2874999999999996 0 0 1.1400000000000001 1.1475 0 0 12.57 1.1400000000000001 0 0 -9.1425 1.1475 0 0 -1.1400000000000001 -1.1475 0 0 -3.4275z"></path><path d="M6.855 4.57125h1.1400000000000001v1.1400000000000001H6.855Z"></path><path d="M5.715 13.713750000000001h2.2800000000000002v2.2874999999999996H5.715Z"></path><path d="M5.715 10.286249999999999h2.2800000000000002v1.1400000000000001H5.715Z"></path><path d="M4.5675 3.4312500000000004h2.2874999999999996v1.1400000000000001H4.5675Z"></path><path d="M3.4275 11.42625h2.2874999999999996v1.1475H3.4275Z"></path><path d="M2.2874999999999996 18.28875h2.2800000000000002v2.2800000000000002H2.2874999999999996Z"></path><path d="M2.2874999999999996 4.57125h2.2800000000000002v1.1400000000000001H2.2874999999999996Z"></path><path d="M1.1400000000000001 12.57375h2.2874999999999996v1.1400000000000001H1.1400000000000001Z"></path><path d="M1.1400000000000001 3.4312500000000004h1.1475v1.1400000000000001H1.1400000000000001Z"></path><path d="M0 13.713750000000001h1.1400000000000001v9.1425H0Z"></path></g>
        </symbol>

        <symbol id="icon-star" viewBox="0 0 24 24">
          <title>Star</title>
          <g><path d="M22.86 9.1425H24v1.1400000000000001h-1.1400000000000001Z"></path><path d="M21.7125 10.2825h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M20.572499999999998 20.572499999999998h1.1400000000000001v2.2800000000000002h-1.1400000000000001Z"></path><path d="M19.424999999999997 18.285h1.1475v2.2874999999999996H19.424999999999997Z"></path><path d="M19.424999999999997 11.4225h2.2874999999999996v1.1475H19.424999999999997Z"></path><path d="M18.285 22.8525h2.2874999999999996V24h-2.2874999999999996Z"></path><path d="M18.285 15.997499999999999h1.1400000000000001v2.2874999999999996h-1.1400000000000001Z"></path><path d="M18.285 12.57h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M17.145 21.7125h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M17.145 13.71h1.1400000000000001v2.2874999999999996h-1.1400000000000001Z"></path><path d="M14.857499999999998 20.572499999999998h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z"></path><path d="M15.997499999999999 7.995h6.862500000000001v1.1475h-6.862500000000001Z"></path><path d="M14.857499999999998 5.715h1.1400000000000001v2.2800000000000002h-1.1400000000000001Z"></path><path d="M13.7175 19.424999999999997h1.1400000000000001v1.1475h-1.1400000000000001Z"></path><path d="M13.7175 12.57h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M13.7175 3.4275h1.1400000000000001v2.2874999999999996h-1.1400000000000001Z"></path><path d="M12.57 18.285h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M12.57 10.2825h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M12.57 1.1400000000000001h1.1475v2.2874999999999996h-1.1475Z"></path><path d="M11.43 17.137500000000003h1.1400000000000001v1.1475h-1.1400000000000001Z"></path><path d="M10.2825 13.71h3.435v1.1475h-3.435Z"></path><path d="M11.43 0h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M10.2825 18.285h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M10.2825 10.2825h1.1475v1.1400000000000001h-1.1475Z"></path><path d="M10.2825 1.1400000000000001h1.1475v2.2874999999999996h-1.1475Z"></path><path d="M9.1425 19.424999999999997h1.1400000000000001v1.1475h-1.1400000000000001Z"></path><path d="M9.1425 12.57h1.1400000000000001v1.1400000000000001h-1.1400000000000001Z"></path><path d="M9.1425 3.4275h1.1400000000000001v2.2874999999999996h-1.1400000000000001Z"></path><path d="M8.0025 5.715h1.1400000000000001v2.2800000000000002h-1.1400000000000001Z"></path><path d="M6.855 20.572499999999998h2.2874999999999996v1.1400000000000001H6.855Z"></path><path d="M5.715 21.7125h1.1400000000000001v1.1400000000000001H5.715Z"></path><path d="M5.715 13.71h1.1400000000000001v2.2874999999999996H5.715Z"></path><path d="M4.574999999999999 15.997499999999999h1.1400000000000001v2.2874999999999996H4.574999999999999Z"></path><path d="M4.574999999999999 12.57h1.1400000000000001v1.1400000000000001H4.574999999999999Z"></path><path d="M3.4275 22.8525h2.2874999999999996V24H3.4275Z"></path><path d="M3.4275 18.285H4.574999999999999v2.2874999999999996H3.4275Z"></path><path d="M2.2874999999999996 11.4225H4.574999999999999v1.1475H2.2874999999999996Z"></path><path d="M2.2874999999999996 20.572499999999998h1.1400000000000001v2.2800000000000002H2.2874999999999996Z"></path><path d="M1.1400000000000001 7.995h6.862500000000001v1.1475H1.1400000000000001Z"></path><path d="M1.1400000000000001 10.2825h1.1475v1.1400000000000001H1.1400000000000001Z"></path><path d="M0 9.1425h1.1400000000000001v1.1400000000000001H0Z"></path></g>
        </symbol>
      </defs>
    </svg>

    <h1 class="sr-only">Work</h1>

    <article
      v-for="project in projects"
      :key="project.path"
      :inert="activeSlug !== null && activeSlug !== project.slug"
      class="max-lg:aspect-5/4 col-span-full lg:col-span-2 lg:row-span-4 group"
    >
      <div
        :ref="wrapperRefFor(project.slug)"
        :class="activeSlug === project.slug
          ? 'absolute z-10 top-0 left-0 w-full h-full bg-(--color-bg) flex flex-col overflow-hidden'
          : 'w-full h-full'"
      >
      <!-- a real link (so crawlers and new-tab clicks work) unless locked;
           plain clicks are intercepted to run the open animation first -->
      <component
        :is="isLocked(project) ? 'button' : 'a'"
        v-if="activeSlug !== project.slug"
        :type="isLocked(project) ? 'button' : undefined"
        :disabled="isLocked(project) || undefined"
        :href="isLocked(project) ? undefined : `/work/${project.slug}`"
        :class="[
          'js-tile reticle relative flex flex-col items-center justify-center gap-y-8 w-full h-full p-8',
          isLocked(project) ? 'cursor-not-allowed' : 'cursor-pointer',
        ]"
        data-audio="maximize"
        @click="onTileClick($event, project)"
      >
        <h2 class="text-center" :style="{ color: isLocked(project) ? 'var(--color-danger)' : undefined }">
          {{ isLocked(project) ? 'Secret Project' : project.title }}
        </h2>

        <ul class="flex justify-center space-x-5">
          <li
            v-for="skill in project.skills.slice(0, 3)"
            :key="skill.icon"
            class="flex items-center justify-center w-12 h-12 border border-(--color-danger) rotate-45"
          >
            <span class="sr-only">{{ skill.label }}</span>
            <svg
              class="size-7 -rotate-45 fill-current"
              :class="isLocked(project) ? 'text-(--color-danger)' : 'text-(--color-fill)'"
            >
              <use :href="`#icon-${skill.icon}`"></use>
            </svg>
          </li>
        </ul>

        <span v-if="!project.secret" class="absolute left-1/2 bottom-8 -translate-x-1/2 flex gap-x-1 items-center justify-center opacity-50">
          {{ isOpened(project.slug) ? '100%' : '0%' }}
        </span>

        <svg v-if="project.secret" class="absolute left-1/2 bottom-8 -translate-x-1/2 size-4 fill-current opacity-50" :class="secretUnlocked ? 'text-(--color-fill)' : 'text-(--color-text)'">
          <use :href="secretUnlocked ? '#icon-lock-opened' : '#icon-lock-closed'"></use>
        </svg>
      </component>

      <template v-else>
        <div class="js-panel-content relative w-full lg:h-1/8 px-8 max-lg:py-4 border-b border-black/50 flex items-center justify-between">
          <p class="cursor-text">{{ project.title }}</p>

          <div class="flex gap-2">
            <button
              type="button"
              class="js-project-action cursor-pointer flex items-center justify-center w-4 h-4 text-xs text-(--color-bg) bg-(--color-danger)"
              data-audio="minimize"
              @click="closeProject(project)"
            ><span class="sr-only">Close Project</span>&#x00D7;</button>
            <a
              :href="project.url"
              target="_blank"
              class="js-project-action cursor-pointer relative flex items-center justify-center w-4 h-4 text-xs text-(--color-bg) bg-(--color-fill) uppercase"
              data-audio="open"
            ><span class="sr-only">Visit the Site</span>&#x2197;</a>
          </div>
        </div>

        <div class="js-panel-content w-full h-full overflow-auto">
          <figure class="relative w-full lg:h-full max-lg:px-8">
            <div class="flex aspect-5/4 lg:aspect-auto lg:h-full w-full items-center justify-center border border-dashed border-black/50 text-center opacity-50 [font-variant-caps:all-small-caps]">
              Preview coming soon
            </div>
          </figure>

          <div class="lg:w-2/3 lg:mx-auto max-lg:px-8 py-24 flex flex-col gap-y-8 [&_p]:cursor-text [&_h3]:cursor-text [&_dt]:cursor-text [&_dd]:cursor-text [&_a]:cursor-pointer">
            <h3 class="uppercase text-center">Role &amp; Bio</h3>

            <ul v-if="!project.secret" class="mt-16 mb-8 flex items-center justify-around lg:justify-between gap-8 border-t border-black/50 text-center">
              <li v-for="skill in project.skills" :key="skill.icon" class="-mt-6">
                <span class="flex items-center justify-center w-12 h-12 mx-auto mb-10 border border-(--color-danger) rotate-45 outline outline-offset-10 ring-10 ring-(--color-bg) outline-black/50 bg-(--color-bg)">
                  <svg class="size-7 text-(--color-fill) fill-current -rotate-45">
                    <use :href="`#icon-${skill.icon}`"></use>
                  </svg>
                </span>
                <p class="[font-variant-caps:all-small-caps]">{{ skill.shortLabel }}</p>
              </li>
            </ul>

            <ContentRenderer :value="project" />

            <dl class="flex flex-wrap gap-y-2 [font-variant-caps:all-small-caps]">
              <dt class="w-full lg:w-1/4 pb-2 flex items-center gap-2 border-b border-black/50"><svg class="size-4 fill-current"><use href="#icon-hyperlink"></use></svg>URL</dt>
              <dd class="w-full lg:w-3/4 pb-2 border-b border-black/50"><a :href="project.url" target="_blank" data-audio="open">{{ project.urlShort }}</a></dd>

              <dt class="w-full lg:w-1/4 pb-2 flex items-center gap-2 border-b border-black/50"><svg class="size-4 fill-current"><use href="#icon-factory"></use></svg>Industry</dt>
              <dd class="w-full lg:w-3/4 pb-2 border-b border-black/50">{{ project.industry }}</dd>

              <template v-if="project.awards.length">
                <dt class="w-full lg:w-1/4 flex items-center gap-2">
                  <svg class="size-4 fill-current"><use href="#icon-trophy"></use></svg>Awards
                </dt>
                <dd class="w-full lg:w-3/4">
                  <a v-for="award in project.awards" :key="award.name" :href="award.url" target="_blank" class="block">{{ award.name }}</a>
                </dd>
              </template>
            </dl>

            <a
              :href="project.url"
              target="_blank"
              class="relative block w-full mt-8 p-4 uppercase bg-(--color-fill) text-(--color-bg) text-center"
              data-audio="open"
            >
              <span class="block relative z-10">Visit the Site &#x2197;</span>
            </a>
          </div>
        </div>
      </template>
      </div>
    </article>
  </main>
</template>
