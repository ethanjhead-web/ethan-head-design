const STORAGE_KEY = 'openedProjects'

export function useWorkProgress() {
  const opened = useState<Record<string, boolean>>('work-opened-state', () => ({}))

  function init() {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      opened.value = stored ? JSON.parse(stored) : {}
    }
  }

  function markOpened(slug: string) {
    if (opened.value[slug]) return
    opened.value = { ...opened.value, [slug]: true }
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opened.value))
    }
  }

  function isOpened(slug: string) {
    return !!opened.value[slug]
  }

  return { opened, init, markOpened, isOpened }
}
