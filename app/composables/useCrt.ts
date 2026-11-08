export function useCrt() {
  const { state: enabled, set, init, reset } = usePersistedState<boolean>({
    key: 'crt-enabled',
    initialValue: false,
    // no choice made yet: default on, unless the user has asked for reduced
    // motion — then default off as a calmer first impression
    getDefault: () => !prefersReducedMotion(),
  })

  return { enabled, set, init, reset }
}
