<template>
  <main class="col-span-1 row-span-4 row-start-4">
    <nav aria-label="Main navigation" class="h-full">
      <ul class="h-full">
          <li class="flex items-center h-1/4 pl-8 bg-(--color-fill) text-(--color-bg)"><NuxtLink to="/work" class="uppercase cursor-pointer" data-audio="menu">Work</NuxtLink></li>
          <li class="flex items-center h-1/4 pl-8"><NuxtLink to="/about" class="uppercase cursor-pointer" data-audio="menu">About</NuxtLink></li>
          <li class="flex items-center h-1/4 pl-8"><NuxtLink to="/blog" class="uppercase cursor-pointer" data-audio="menu">Blog</NuxtLink></li>
          <li class="flex items-center h-1/4 pl-8"><NuxtLink to="/options" class="uppercase cursor-pointer" data-audio="menu">Options</NuxtLink></li>
        </ul>
    </nav>
  </main>
</template>
