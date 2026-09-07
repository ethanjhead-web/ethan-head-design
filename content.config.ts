import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const skill = z.object({
  icon: z.string(),
  label: z.string(),
  shortLabel: z.string(),
})

const award = z.object({
  name: z.string(),
  url: z.string(),
})

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        order: z.number(),
      }),
    }),
    work: defineCollection({
      type: 'page',
      source: 'work/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        order: z.number(),
        skills: z.array(skill),
        poster: z.string(),
        industry: z.string(),
        url: z.string(),
        urlShort: z.string(),
        secret: z.boolean().default(false),
        awards: z.array(award).default([]),
      }),
    }),
  },
})
