const ONE_YEAR = 60 * 60 * 24 * 365

// Shared shape behind useCrt/useSfx: a user preference stored in a cookie
// (not localStorage) so the server can render the saved choice on first
// paint instead of it switching on after hydration.
//
// `stored` is null until the visitor makes a choice; until then the value is
// `getDefault()`, which may read browser APIs and so is only resolved on the
// client, in init().
export function usePersistedState<T>(options: {
  key: string
  initialValue: T
  getDefault?: () => T
}) {
  const { key, initialValue, getDefault = () => initialValue } = options

  const cookie = useCookie<T | null>(key, { default: () => null, maxAge: ONE_YEAR, sameSite: 'lax' })
  const stored = useState<T | null>(`${key}:stored`, () => cookie.value ?? null)
  const fallback = useState<T>(`${key}:default`, () => initialValue)

  const state = computed(() => stored.value ?? fallback.value)

  function set(value: T) {
    stored.value = value
    cookie.value = value
  }

  // call from onMounted. Re-reading the cookie covers prerendered pages,
  // where the server never saw it.
  function init() {
    if (!import.meta.client) return
    stored.value = cookie.value ?? null
    if (stored.value === null) fallback.value = getDefault()
  }

  function reset() {
    stored.value = null
    cookie.value = null
    if (import.meta.client) fallback.value = getDefault()
  }

  return { state, set, init, reset }
}
