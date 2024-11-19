<template>
  <RouterView />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router/auto'

const router = useRouter()

onMounted(() => {
  router.push('/daily')
})
</script>