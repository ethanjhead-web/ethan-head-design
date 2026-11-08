// Client-only check; on the server there's no preference to read, so animate.
export function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
