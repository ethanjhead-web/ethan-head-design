<script setup>
const route = useRoute()
const path = `/blog/${route.params.slug}`

const { data: post } = await useAsyncData(path, () => queryCollection('blog').path(path).first())

useSeoMeta({
  title: () => (post.value ? `${post.value.title} — Blog` : 'Blog'),
  description: () =>
    post.value?.description ??
    'I am more of a designer than a writer, but, apparently, google thinks writing blogs is important.',
  ogType: 'article',
})
</script>

<template>
  <template v-if="post">
    <p class="cursor-text lg:absolute lg:top-0 lg:left-0 lg:flex lg:items-center lg:justify-center lg:w-2/3 lg:h-1/4 lg:border-b lg:border-black/50 lg:uppercase">{{ post.title }}</p>

    <article class="w-full lg:w-2/3 lg:h-3/4 lg:mt-auto mb-0 lg:overflow-auto">
      <h2 class="sr-only">{{ post.title }}</h2>
      <ContentRenderer :value="post" class="*:cursor-text py-8 lg:p-16 space-y-8" />
    </article>
  </template>

  <p v-else class="cursor-text p-8">Post not found.</p>
</template>
