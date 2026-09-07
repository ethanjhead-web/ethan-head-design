const SOUND_MAP: Record<string, string> = {
  menu: '/audio/click_002.ogg',
  select: '/audio/select_007.ogg',
  switch: '/audio/switch_002.ogg',
  open: '/audio/open_001.ogg',
  type: '/audio/scroll_003.ogg',
  maximize: '/audio/maximize_006.ogg',
  minimize: '/audio/minimize_006.ogg',
  reveal: '/audio/confirmation_002.ogg',
}

export default defineNuxtPlugin((nuxtApp) => {
  const { enabled } = useSfx()
  const cache = new Map<string, HTMLAudioElement>()

  function getAudio(key: string) {
    let audio = cache.get(key)
    if (!audio) {
      audio = new Audio(SOUND_MAP[key])
      cache.set(key, audio)
    }
    return audio
  }

  function playSfx(key: string) {
    if (!enabled.value || !(key in SOUND_MAP)) return
    const audio = getAudio(key)
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest?.('[data-audio]')
    const key = target?.getAttribute('data-audio')
    if (key) playSfx(key)
  })

  nuxtApp.provide('playSfx', playSfx)
})
