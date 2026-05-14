<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()

const STORAGE_KEY = 'maaly-announcement-seen'
const RELEASE_KEY = '__release__'
const RELEASE_SEEN_KEY = 'maaly-release-seen'

const modules = import.meta.glob('../../../zh_cn/notice/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const files = computed(() =>
  Object.entries(modules)
    .map(([path, content]) => {
      const rawName = path.split('/').pop()!.replace('.md', '')
      const name = rawName.replace(/^\d+\.\d+-/, '')
      return { key: rawName, name, content }
    })
    .sort((a, b) => a.key.localeCompare(b.key, 'zh'))
)

// 构建时从 git commit 取的公告日期
const noticeDates = computed<Record<string, string>>(() => (theme.value as any).noticeDates || {})

const selectedDate = computed(() => noticeDates.value[selected.value])

const visible = ref(false)
const selected = ref('')

// 构建时已获取的 release 数据（与版本标签同源）
const release = computed(() => {
  const meta: any = theme.value.latestReleaseMeta
  if (meta?.body) {
    return {
      tag_name: meta.version,
      html_url: meta.link,
      body: meta.body,
      published_at: meta.published_at,
      bodyFingerprint: meta.bodyFingerprint,
    }
  }
  return null
})

const bodyHtml = computed(() => {
  const file = files.value.find((f) => f.key === selected.value)
  return file ? renderMarkdown(file.content) : ''
})

function renderMarkdown(md: string) {
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = escaped
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
  return '<p>' + html + '</p>'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(() => {
  const current = files.value.map((f) => f.key).join('|')
  const stored = localStorage.getItem(STORAGE_KEY)

  // 有新的本地公告文件时显示弹窗
  if (stored !== current && files.value.length) {
    selected.value = files.value[0].key
    visible.value = true
  }

  const popupHandler = (e: Event) => {
    const el = (e.target as Element).closest('a[href*="maaly-popup-"]')
    if (!el) return
    const href = el.getAttribute('href')!
    const match = href.match(/maaly-popup-([^#?]+)/)
    if (!match) return
    e.preventDefault()
    e.stopImmediatePropagation()
    selected.value = decodeURIComponent(match[1])
    visible.value = true
  }
  document.addEventListener('click', popupHandler, true)
  document.addEventListener('mousedown', popupHandler, true)

  // 构建时已获取 release，内容指纹变化时自动弹出
  if (!visible.value && release.value?.bodyFingerprint) {
    const seenRelease = localStorage.getItem(RELEASE_SEEN_KEY)
    if (seenRelease !== release.value.bodyFingerprint) {
      selected.value = RELEASE_KEY
      visible.value = true
    }
  }
})

function dismiss() {
  localStorage.setItem(STORAGE_KEY, files.value.map((f) => f.key).join('|'))
  if (release.value?.bodyFingerprint) {
    localStorage.setItem(RELEASE_SEEN_KEY, release.value.bodyFingerprint)
  }
  visible.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="ap-overlay" @click.self="dismiss">
      <div class="ap-dialog">
        <div class="ap-header">
          <span class="ap-title">公告</span>
        </div>

        <div class="ap-tabs">
          <button
            v-for="file in files"
            :key="file.key"
            class="ap-tab"
            :class="{ active: selected === file.key }"
            @click="selected = file.key"
          >{{ file.name }}</button>
          <button
            class="ap-tab"
            :class="{ active: selected === RELEASE_KEY }"
            @click="selected = RELEASE_KEY"
          >更新公告</button>
        </div>

        <div class="ap-body">
          <template v-if="selected === RELEASE_KEY">
            <div v-if="release" class="ap-notice">
              <div class="ap-release-header">
                <span class="ap-release-tag">{{ release.tag_name }}</span>
                <span v-if="release.published_at" class="ap-release-date">{{ formatDate(release.published_at) }}</span>
              </div>
              <div v-html="renderMarkdown(release.body || '')"></div>
              <a v-if="release.html_url" class="ap-release-link" :href="release.html_url" target="_blank" rel="noopener">
                在 GitHub 上查看完整更新 →
              </a>
            </div>
            <div v-else class="ap-release-status">暂无更新公告</div>
          </template>
          <div v-else class="ap-notice">
            <div v-if="selectedDate" class="ap-notice-date">{{ formatDate(selectedDate) }}</div>
            <div v-html="bodyHtml"></div>
          </div>
        </div>

        <div class="ap-footer">
          <button class="ap-btn" @click="dismiss">我知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ap-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.ap-dialog {
  width: 640px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.ap-header {
  padding: 20px 24px 0;
}

.ap-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.ap-tabs {
  display: flex;
  gap: 0;
  padding: 12px 24px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  overflow-x: auto;
}

.ap-tab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}

.ap-tab:hover { color: var(--vp-c-text-1); }

.ap-tab.active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}

.ap-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 200px;
  max-height: 420px;
}

.ap-notice {
  font-size: 14px;
  line-height: 1.8;
  color: var(--vp-c-text-1);
}

.ap-notice :deep(p) { margin: 0 0 10px; }
.ap-notice :deep(ul) { margin: 8px 0; padding-left: 20px; }
.ap-notice :deep(li) { list-style: disc; margin: 4px 0; }
.ap-notice :deep(a) { color: var(--vp-c-brand-1); font-weight: 500; }
.ap-notice :deep(h2) { font-size: 16px; font-weight: 600; margin: 16px 0 8px; }
.ap-notice :deep(h3) { font-size: 15px; font-weight: 600; margin: 12px 0 6px; }
.ap-notice :deep(strong) { font-weight: 600; }
.ap-notice :deep(code) { font-size: 13px; background: var(--vp-c-bg-soft); padding: 1px 4px; border-radius: 3px; }

.ap-notice-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.ap-release-status {
  font-size: 14px;
  color: var(--vp-c-text-2);
  padding: 24px 0;
}

.ap-release-error { color: var(--vp-c-danger-1); }

.ap-release-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.ap-release-tag {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.ap-release-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.ap-release-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
}

.ap-footer {
  padding: 12px 24px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--vp-c-divider);
}

.ap-btn {
  padding: 6px 24px;
  border-radius: 6px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.ap-btn:hover { background: var(--vp-c-brand-2); }
</style>
