<template>
    <BingoBoard :mode="mode" />
  </template>
  
  <script lang="ts" setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router/auto'
  
  const route = useRoute()
  const mode = computed(() => {
    const path = route.path
    if (path.includes('versus')) return 'versus'
    if (path.includes('random')) return 'random'
    return 'daily'
  })
  </script>