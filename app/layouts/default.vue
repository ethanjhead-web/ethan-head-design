<script setup>
const { enabled: crtEnabled, init: initCrt } = useCrt()
const { init: initSfx } = useSfx()

onMounted(() => {
  initCrt()
  initSfx()
})
</script>

<template>
  <svg aria-hidden="true" class="absolute w-0 h-0 overflow-hidden" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <symbol viewBox="0 0 24 24" id="icon-back"><title>Go Back</title><path d="M22.86 6.855h-1.1475V4.5675h-1.1400000000000001V3.4275H19.424999999999997V2.2874999999999996h-2.2800000000000002V1.1400000000000001h-2.2874999999999996V0h-5.715v1.1400000000000001H6.855v1.1475H4.5675v1.1400000000000001H3.4275v1.1400000000000001H2.2874999999999996v2.2874999999999996H1.1400000000000001v2.2874999999999996H0v5.715h1.1400000000000001v2.2874999999999996h1.1475v2.2800000000000002h1.1400000000000001v1.1475h1.1400000000000001v1.1400000000000001h2.2874999999999996v1.1475h2.2874999999999996V24h5.715v-1.1400000000000001h2.2874999999999996v-1.1475h2.2800000000000002v-1.1400000000000001h1.1475V19.424999999999997h1.1400000000000001v-2.2800000000000002h1.1475v-2.2874999999999996H24v-5.715h-1.1400000000000001ZM19.424999999999997 15.997499999999999h-1.1400000000000001v1.1475h-1.1400000000000001v1.1400000000000001h-3.4275v-1.1400000000000001h1.1400000000000001v-1.1475h1.1400000000000001v-1.1400000000000001h-1.1400000000000001v-1.1400000000000001h-4.574999999999999v2.2800000000000002h-1.1400000000000001v-1.1400000000000001h-1.1400000000000001v-1.1400000000000001H6.855v-1.1475H5.715v-1.1400000000000001H4.5675v-1.1475h1.1475v-1.1400000000000001h1.1400000000000001v-1.1400000000000001h1.1475V6.855h1.1400000000000001V5.715h1.1400000000000001v2.2874999999999996h6.862500000000001v1.1400000000000001h1.1400000000000001v1.1400000000000001h1.1400000000000001Z"></path></symbol>
    </defs>
  </svg>

  <svg width="0" height="0" style="position: absolute" aria-hidden="true">
    <defs>
      <filter id="crt-chromatic-aberration" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <!-- barrel curvature: a precomputed map (R = x-displacement, G =
             y-displacement, quadratic falloff from a flat center) warps the
             live DOM before the channels split, so aberration reads as a
             property of the same curved glass rather than a flat overlay. -->
        <feImage href="/crt-displacement.png" x="-20%" y="-20%" width="140%" height="140%"
          preserveAspectRatio="none" result="curveMap"/>
        <feDisplacementMap in="SourceGraphic" in2="curveMap" scale="14"
          xChannelSelector="R" yChannelSelector="G" result="curved"/>

        <feColorMatrix in="curved" type="matrix"
          values="1 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0" result="red"/>
        <feOffset in="red" dx="-1.5" dy="0" result="redOffset"/>

        <feColorMatrix in="curved" type="matrix"
          values="0 0 0 0 0
                  0 1 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0" result="green"/>

        <feColorMatrix in="curved" type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0" result="blue"/>
        <feOffset in="blue" dx="1.5" dy="0" result="blueOffset"/>

        <feBlend in="redOffset" in2="green" mode="screen" result="rg"/>
        <feBlend in="rg" in2="blueOffset" mode="screen"/>
      </filter>
    </defs>
  </svg>

  <div class="overscroll-none">
    <div :class="{ crt: crtEnabled }" class="grid grid-cols-6 lg:h-screen lg:grid-rows-10 bg-(--color-bg) max-lg:text-xl text-(--color-text) selection:bg-(--color-highlight) selection:text-(--color-bg) antialiased cursor-auto transition-colors duration-300">
      <!-- <header class="max-lg:px-8 max-lg:pt-8 absolute z-10 top-8 lg:top-16 left-8 lg:left-16">
          <NuxtLink to="/" data-audio="menu" class="cursor-pointer">
              <span class="sr-only">Go Back</span>
              <svg class="size-6 lg:size-4 text-(--color-text) fill-current">
                  <use href="#icon-back"></use>
              </svg>
            </NuxtLink>
      </header> -->

      <slot />
    </div>
  </div>
</template>
