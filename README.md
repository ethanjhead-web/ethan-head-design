# Ethan Head — Portfolio (V4)

Personal portfolio site built with Nuxt 4, Nuxt Content, Tailwind CSS v4 and GSAP.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # server build (.output/)
npm run generate   # static build (.output/public/)
npm run preview    # preview the last build
```

## Structure

- `content/work/*.md`, `content/blog/*.md` — projects and posts; frontmatter schemas live in `content.config.ts`
- `app/pages/work/[[slug]].vue` — the work grid and project panels (one reused page instance so tiles can animate into panels)
- `app/utils/themes.ts` — the theme list; each theme's colors are a `[data-theme]` block in `app/assets/css/main.css`
- `app/composables/` — visitor preferences (CRT, SFX) and work progress, stored in cookies so the server renders them on first paint
- `app/plugins/` — GSAP and the click sound-effect handler (`data-audio="<key>"` on any element)

The secret project unlocks once every other project has been opened.
