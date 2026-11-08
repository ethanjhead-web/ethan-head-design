const ONE_YEAR = 60 * 60 * 24 * 365

// Slugs of projects the visitor has opened, kept in a cookie so the server
// renders progress (and the secret project's lock state) correctly.
export function useWorkProgress() {
  const cookie = useCookie<string[]>('work-opened', { default: () => [], maxAge: ONE_YEAR, sameSite: 'lax' })
  const readCookie = () => (Array.isArray(cookie.value) ? cookie.value : [])
  const opened = useState<string[]>('work-opened', readCookie)

  // call from onMounted; covers prerendered pages, where the server never saw the cookie
  function init() {
    if (import.meta.client) opened.value = readCookie()
  }

  function markOpened(slug: string) {
    if (opened.value.includes(slug)) return
    opened.value = [...opened.value, slug]
    cookie.value = opened.value
  }

  function isOpened(slug: string) {
    return opened.value.includes(slug)
  }

  return { opened, init, markOpened, isOpened }
}
