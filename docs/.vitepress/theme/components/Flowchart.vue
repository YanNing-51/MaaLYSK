<template>
  <div class="flowchart"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  code: string
}>()

onMounted(async () => {
  console.log('Flowchart mounting, code:', props.code)

  // 动态 import，避免将 mermaid 打包进主 bundle（~2MB），只有用到流程图的页面才按需下载
  const mermaid = (await import('mermaid')).default

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose'
  })

  try {
    const id = `mermaid-${Date.now()}`
    const { svg } = await mermaid.render(id, props.code)
    const container = document.querySelector('.flowchart')
    if (container) {
      container.innerHTML = svg
    }
    console.log('Render success')
  } catch (err) {
    console.error('Render error:', err)
  }
})
</script>