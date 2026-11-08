<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => (notFound.value ? 'Not Found' : 'Error') })
</script>

<template>
  <NuxtLayout>
    <main class="col-span-full row-span-full flex flex-col items-center justify-center gap-y-8 p-8 text-center">
      <h1 class="uppercase text-(--color-danger)">{{ error.statusCode }}</h1>
      <p class="cursor-text">{{ notFound ? 'There’s nothing at this address.' : 'Something went wrong.' }}</p>
      <button
        type="button"
        class="cursor-pointer uppercase bg-(--color-fill) text-(--color-bg) px-4 py-2"
        data-audio="menu"
        @click="clearError({ redirect: '/' })"
      >Back to menu</button>
    </main>
  </NuxtLayout>
</template>
