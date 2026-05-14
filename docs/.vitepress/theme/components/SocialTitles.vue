<script lang="ts" setup>
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

function setTitles() {
  document.querySelectorAll('.VPSocialLink').forEach((el) => {
    const label = el.getAttribute('aria-label')
    if (label && !el.hasAttribute('title')) {
      el.setAttribute('title', label)
    }
  })
}

const route = useRoute()
onMounted(() => nextTick(setTitles))
watch(() => route.path, () => setTimeout(setTitles, 100))
</script>

<template>
  <span style="display:none"></span>
</template>
