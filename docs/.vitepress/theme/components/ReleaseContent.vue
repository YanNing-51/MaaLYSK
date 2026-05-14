<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const release = ref<any>(null)
const loading = ref(true)
const error = ref('')

function renderMarkdown(md: string) {
  const html = md
    .replace(/\r\n/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const blocks = html.split(/\n{2,}/)
  return blocks
    .map((block) => {
      const t = block.trim()
      if (!t) return ''

      if (t.startsWith('### ')) return `<h3>${inline(t.slice(4))}</h3>`
      if (t.startsWith('## ')) return `<h2>${inline(t.slice(3))}</h2>`
      if (t.startsWith('# ')) return `<h1>${inline(t.slice(2))}</h1>`

      if (!t.includes('\n')) {
        if (t.startsWith('- ### ')) return `<h3>${inline(t.slice(6))}</h3>`
        if (t.startsWith('- ## ')) return `<h2>${inline(t.slice(5))}</h2>`
        if (t.startsWith('- # ')) return `<h1>${inline(t.slice(4))}</h1>`
      }

      const lines = t.split(/\n/).map((line) => {
        const lt = line.trim()
        if (!lt) return ''
        if (lt.startsWith('- ### ')) return `<li><strong>${inline(lt.slice(6))}</strong></li>`
        if (lt.startsWith('- ## ')) return `<li><strong>${inline(lt.slice(5))}</strong></li>`
        if (lt.startsWith('- # ')) return `<li><strong>${inline(lt.slice(4))}</strong></li>`
        if (lt.startsWith('- ')) return `<li>${inline(lt.slice(2))}</li>`
        return inline(lt)
      }).filter(Boolean)

      if (!lines.length) return ''
      if (lines.every((l) => l.startsWith('<li>'))) return `<ul>${lines.join('')}</ul>`
      return `<p>${lines.join('<br>')}</p>`
    })
    .filter(Boolean)
    .join('')
}

function inline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

onMounted(async () => {
  try {
    const res = await fetch(
      'https://api.github.com/repos/Witty36/MaaLYSK/releases?per_page=1',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    release.value = data.find((r: any) => !r.draft && r.tag_name) || data[0]
  } catch (e: any) {
    error.value = e.message || 'Failed to load release'
  } finally {
    loading.value = false
  }
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="release-content">
    <div v-if="loading" class="release-loading">加载中…</div>
    <div v-else-if="error" class="release-error">加载失败：{{ error }}</div>
    <template v-else-if="release">
      <div class="release-header">
        <span class="release-tag">{{ release.tag_name || release.name }}</span>
        <span v-if="release.published_at" class="release-date">{{ formatDate(release.published_at) }}</span>
      </div>
      <div class="release-body" v-html="renderMarkdown(release.body || '')"></div>
      <a v-if="release.html_url" class="release-link" :href="release.html_url" target="_blank" rel="noopener">
        在 GitHub 上查看完整更新 →
      </a>
    </template>
  </div>
</template>

<style scoped>
.release-content {
  font-size: 14px;
  line-height: 1.7;
}

.release-loading,
.release-error {
  color: var(--vp-c-text-2);
  padding: 24px 0;
}

.release-error { color: var(--vp-c-danger-1); }

.release-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.release-tag {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.release-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.release-body :deep(h2) {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 8px;
  border-top: none;
}

.release-body :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  margin: 16px 0 6px;
}

.release-body :deep(p) {
  margin: 0 0 8px;
}

.release-body :deep(li) {
  margin-left: 20px;
  list-style: disc;
}

.release-body :deep(code) {
  font-size: 13px;
  background: var(--vp-c-bg-soft);
  padding: 1px 4px;
  border-radius: 3px;
}

.release-body :deep(a) {
  color: var(--vp-c-brand-1);
}

.release-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
}
</style>
