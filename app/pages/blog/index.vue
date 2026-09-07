<script setup>
const { data: firstPost } = await useAsyncData('blog-index-redirect', () =>
  queryCollection('blog').order('order', 'ASC').select('path').first(),
)

if (firstPost.value) {
  await navigateTo(firstPost.value.path, { redirectCode: 301 })
}
</script>

<template>
  <div />
</template>
