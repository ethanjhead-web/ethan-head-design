export function useSfx() {
  const { state: enabled, set, init, reset } = usePersistedState<boolean>({
    key: 'sfx-enabled',
    initialValue: false,
  })

  return { enabled, set, init, reset }
}
