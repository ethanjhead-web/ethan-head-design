// Single list of selectable themes. Each id needs a matching
// [data-theme='<id>'] block in assets/css/main.css.
export const THEMES = [
  { id: 'code', label: 'Code' },
  { id: 'melon', label: 'Melon' },
  { id: 'vapor', label: 'Vapor' },
  { id: 'game', label: 'Game' },
  { id: 'paint', label: 'Paint' },
  { id: 'moon', label: 'Moon' },
  { id: 'acid', label: 'Acid' },
  { id: '1-bit', label: '1-Bit' },
  { id: 'vacay', label: 'Vacay' },
  { id: 'devil', label: 'Devil' },
] as const

export const DEFAULT_THEME = 'code'
