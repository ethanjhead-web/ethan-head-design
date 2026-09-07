// Shared shape behind useCrt/useSfx: a useState value mirrored to
// localStorage. Each composable configures its own default, (de)serialization,
// and whether init()/reset() should persist the computed default back to
// storage — those flags exist to preserve each preference's original
// behavior, not as speculative options.
export function usePersistedState<T>(options: {
  storageKey: string
  stateKey: string
  initialValue: T
  getDefault?: () => T
  serialize?: (value: T) => string
  deserialize?: (raw: string) => T
  onChange?: (value: T) => void
  persistDefaultOnInit?: boolean
  clearStorageOnReset?: boolean
}) {
  const {
    storageKey,
    stateKey,
    initialValue,
    getDefault = () => initialValue,
    serialize = (value: T) => String(value),
    deserialize = (raw: string) => raw as unknown as T,
    onChange,
    persistDefaultOnInit = false,
    clearStorageOnReset = false,
  } = options

  const state = useState<T>(stateKey, () => initialValue)

  function apply(value: T) {
    state.value = value
    onChange?.(value)
  }

  function set(value: T) {
    apply(value)
    if (import.meta.client) localStorage.setItem(storageKey, serialize(value))
  }

  function init() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) apply(deserialize(stored))
    else if (persistDefaultOnInit) set(getDefault())
    else apply(getDefault())
  }

  function reset() {
    if (!import.meta.client) return
    if (clearStorageOnReset) {
      localStorage.removeItem(storageKey)
      apply(getDefault())
    } else {
      set(getDefault())
    }
  }

  return { state, set, init, reset }
}
