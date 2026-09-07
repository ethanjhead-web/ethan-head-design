<script setup>
const colorMode = useColorMode()

const themes = ['code', 'melon', 'vapor', 'game', 'paint', 'moon', 'acid', '1-bit', 'vacay', 'devil']
const themeLabels = {
  code: 'Code', melon: 'Melon', vapor: 'Vapor', game: 'Game', paint: 'Paint',
  moon: 'Moon', acid: 'Acid', '1-bit': '1-Bit', vacay: 'Vacay', devil: 'Devil',
}

const { enabled: crtEnabled, set: setCrt, reset: resetCrt } = useCrt()
const { enabled: sfxEnabled, set: setSfx, reset: resetSfx } = useSfx()

function factoryReset() {
  colorMode.preference = 'code'
  resetSfx()
  resetCrt()
}
</script>

<template>
    <main id="options" class="max-lg:p-8 col-span-full row-span-full space-y-8">

        <h1 class="sr-only">Options</h1>

        
            <section class="space-y-4">
                <p class="cursor-text">Theme: <span id="theme-name">{{ themeLabels[colorMode.preference] ?? colorMode.preference }}</span></p>
                <ul class="flex gap-4">
                  <li v-for="theme in themes" :key="theme" class="space-y-4" :data-theme="theme">
                    <button
                      type="button"
                      :aria-pressed="colorMode.preference === theme"
                      @click="colorMode.preference = theme"
                      class="aria-pressed:border aria-pressed:border-(--color-highlight) focus:outline focus:outline-offset-1 cursor-pointer block w-4 h-8 bg-linear-to-b from-(--color-bg) from-50% via-(--color-text) via-50% to-(--color-text)"
                    >
                      <span class="sr-only">{{ theme }}</span>
                    </button>
                  </li>
                </ul>
              </section>

            <section class="space-y-4">
                    <p class="cursor-text">SFX: <span id="sfx-text">{{ sfxEnabled ? 'On' : 'Off' }}</span></p>

                    <label for="sfx-select" class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="sfx-select" class="sr-only peer" value="SFX" :checked="sfxEnabled" @change="setSfx($event.target.checked)" />
                        <div class="bg-black/50 border border-black/50 w-8 h-4 after:bg-(--color-text) after:absolute after:h-4 after:w-4 after:top-0 after:left-0 peer-checked:after:translate-x-4 peer-checked:after:bg-(--color-highlight) peer-checked:border-(--color-highlight) peer-focus-visible:outline peer-focus-visible:outline-offset-1"><span class="sr-only">SFX</span></div>
                    </label>
            </section>

            <section class="space-y-4">
                    <p class="cursor-text">CRT: <span id="crt-text">{{ crtEnabled ? 'On' : 'Off' }}</span></p>

                    <label for="crt-select" class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="crt-select" class="sr-only peer" value="CRT" data-audio="switch" :checked="crtEnabled" @change="setCrt($event.target.checked)" />
                        <div class="bg-black/50 border border-black/50 w-8 h-4 after:bg-(--color-text) after:absolute after:h-4 after:w-4 after:top-0 after:left-0 peer-checked:after:translate-x-4 peer-checked:after:bg-(--color-highlight) peer-checked:border-(--color-highlight) peer-focus-visible:outline peer-focus-visible:outline-offset-1"><span class="sr-only">CRT</span></div>
                    </label>
            </section>
        
        <button type="button" id="reset" @click="factoryReset" class="flex items-center gap-3 cursor-pointer [font-variant-caps:all-small-caps] active:text-(--color-highlight)"><span class="block w-2 h-2 mt-1 mb-px bg-current"></span>Factory Reset</button>
    </main>
  </template>