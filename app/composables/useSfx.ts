export function useSfx() {
  const { state: enabled, set, init, reset } = usePersistedState<boolean>({
    storageKey: 'sfx-enabled',
    stateKey: 'sfx-enabled-state',
    initialValue: false,
    serialize: (value) => (value ? '1' : '0'),
    deserialize: (raw) => raw === '1',
  })

  return { enabled, set, init, reset }
}
