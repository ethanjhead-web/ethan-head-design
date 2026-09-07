<script setup>
const { data: posts } = await useAsyncData('blog-nav', () =>
  queryCollection('blog').order('order', 'ASC').select('path', 'title').all(),
  { default: () => [] },
)
</script>

<template>
    <main id="blog" class="max-lg:p-8 relative col-span-full row-span-full flex flex-wrap lg:flex-row-reverse lg:border lg:border-black/50 text-pretty">
        <h1 class="sr-only">Blog</h1>

        <nav
          aria-label="Blog posts"
          class="max-lg:order-first flex lg:flex-col w-full lg:w-1/3 lg:h-full max-lg:mb-8 max-lg:border lg:border-l border-black/50 max-lg:divide-x max-lg:divide-black/50"
        >
          <NuxtLink
            v-for="(post, index) in posts"
            :key="post.path"
            :to="post.path"
            data-audio="type"
            active-class="text-(--color-highlight)"
            class="max-lg:aspect-square max-lg:overflow-hidden lg:reticle w-1/8 lg:w-full lg:h-1/8 lg:border-b lg:border-black/50 last:border-b-0 relative flex items-center justify-center px-4 group cursor-pointer"
          >
            <span class="lg:sr-only">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="max-lg:sr-only">{{ post.title }}</span>
          </NuxtLink>
        </nav>

        <NuxtPage />
    </main>
</template>
