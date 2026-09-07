export function useCrt() {
  const { state: enabled, set, init, reset } = usePersistedState<boolean>({
    storageKey: 'crt-enabled',
    stateKey: 'crt-enabled-state',
    initialValue: false,
    // no choice made yet: default on, unless the user has asked for reduced
    // motion — then default off as a calmer first impression
    getDefault: () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    serialize: (value) => (value ? '1' : '0'),
    deserialize: (raw) => raw === '1',
    clearStorageOnReset: true,
  })

  return { enabled, set, init, reset }
}
