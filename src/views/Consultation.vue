<template>
  <div class="consultation-page">
    <!-- 大白话：这个 canvas 和首页一样，专门负责整页漂浮的小墨点背景 -->
    <canvas id="consultation-ink-canvas" class="consultation-page__ink-canvas"></canvas>

    <main class="consultation-main consultation-main--full">
      <div class="consultation-main__art" aria-hidden="true">
        <div class="consultation-main__art-image"></div>
      </div>

      <section ref="chatBodyRef" class="consultation-chat">
        <div class="consultation-chat__chapter">
          <span class="consultation-chat__chapter-pill">
            {{ currentSession?.sessionTitle || 'Chapter 1: A Quiet Afternoon' }}
          </span>
        </div>

        <template v-if="!Array.isArray(messages) || messages.length === 0">
          <div class="consultation-message consultation-message--ai">
            <div class="consultation-message__bubble consultation-message__bubble--ai">
              <p>您好！我是小暖，您的AI心理健康助手。很高兴陪伴您，为您提供温暖的心理支持。请告诉我，今天您感觉怎么样？有什么想要分享的吗？</p>
            </div>
            <div class="consultation-message__meta">Kokoro-kun · {{ initialMessageTime }}</div>
          </div>
        </template>

        <div
          v-for="msg in messages || []"
          :key="msg.id"
          class="consultation-message"
          :class="msg.senderType === 1 ? 'consultation-message--user' : 'consultation-message--ai'"
        >
          <div
            class="consultation-message__bubble"
            :class="msg.senderType === 1 ? 'consultation-message__bubble--user' : 'consultation-message__bubble--ai'"
          >
            <div v-if="msg.senderType === 2 && isAiTyping && !msg.content" class="consultation-message__typing">
              <span class="consultation-message__typing-dot"></span>
              <span class="consultation-message__typing-dot"></span>
              <span class="consultation-message__typing-dot"></span>
            </div>
            <div v-else-if="msg.isError" class="consultation-message__error">
              <p>{{ msg.content }}</p>
            </div>
            <MarkdownRenderer v-else-if="msg.senderType === 2 && !msg.isError" :content="msg.content" :is-ai-message="true" />
            <p v-else-if="msg.content" v-html="formatMessageContent(msg.content)"></p>
          </div>
          <div class="consultation-message__meta" :class="{ 'consultation-message__meta--user': msg.senderType === 1 }">
            {{ msg.senderType === 1 ? 'You' : 'Kokoro-kun' }} ·
            {{ formatMessageTime(msg.createAt || msg.createdAt) }}
          </div>
        </div>
      </section>

      <footer class="consultation-composer">
        <div class="consultation-composer__bar">
          <input
            v-model="userMessage"
            class="consultation-composer__input"
            type="text"
            maxlength="500"
            :disabled="isAiTyping"
            placeholder="Write your thoughts here..."
            @keydown="handleKeyDown"
            @keyup.enter="sendMessage"
          />
          <button
            class="consultation-composer__send"
            type="button"
            aria-label="Edit message"
            :disabled="!userMessage.trim() || userMessage.length > 500"
            @click="sendMessage"
          >
            <el-icon><Promotion /></el-icon>
          </button>
        </div>
        <p class="consultation-composer__caption">Kokoro AI Consultation · Your safe space</p>
      </footer>
    </main>
  </div>
</template>

<script setup>
// ==================== 导入依赖 ====================
// vue 核心：ref 响应式变量、onMounted 页面加载完执行、onBeforeUnmount 页面销毁前清理、nextTick 等页面更新完再操作 DOM
import { ref , watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

// ==================== AI 配置：Cloudflare Workers AI（免费） ====================
const AI_CHAT_URL = '/api/ai-chat'
const SYSTEM_PROMPT = '你是一个温暖、专业的心理咨询AI助手，名叫 Kokoro。请用温柔、共情的语气回复，帮助用户梳理情绪、缓解压力。回复简洁有洞察力，控制在 200 字以内。像朋友一样聊天，但保持专业边界。'


// ==================== 新建会话 ====================
const createNewFrontendSession = () => {
  currentSession.value = {
    sessionId: `local_${Date.now()}`,
    sessionTitle: 'A Quiet Afternoon'
  }
  messages.value = []
  userMessage.value = ''
  isAiTyping.value = false
  initialMessageTime.value = formatMessageTime(new Date())
  resetChatScroll()
}

// ==================== 页面数据 ====================
const currentSession = ref(null)
// 右边聊天区域里显示的聊天消息列表（每条都是一个对象：id / senderType / content）
const messages = ref([])
// 用户当前在输入框里打的文本
const userMessage = ref('')
// 大白话：这个专门拿来控制默认欢迎语下面显示的时间，新建对话时会重新刷新成当前时间。
const initialMessageTime = ref('')
// 大白话：右边消息盒子的 DOM 引用，后面点“新对话”时让它自动滚回顶部。
const chatBodyRef = ref(null)

// 标记 AI 是否正在打字中，正在打字时输入框不能用
const isAiTyping = ref(false)

// ==================== 本地缓存：纯浏览器 localStorage ====================
const CACHE_KEY = 'consultation_local'
const MAX_CACHED_MESSAGES = 100 // 大白话：最多存 100 条，再多就裁掉旧的。

const saveLocalCache = () => {
  if (!currentSession.value || !currentSession.value.sessionId) return
  const trimmed = messages.value.length > MAX_CACHED_MESSAGES
    ? messages.value.slice(-MAX_CACHED_MESSAGES)
    : messages.value
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    session: currentSession.value,
    messages: trimmed
  }))
}

// 大白话：刷新后从浏览器缓存恢复上次对话。
const restoreLocalCache = () => {
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

const clearLocalCache = () => {
  localStorage.removeItem(CACHE_KEY)
}

// 大白话：消息变化、切会话都自动存。
watch(messages, () => { saveLocalCache() }, { deep: true })
watch(currentSession, () => { saveLocalCache() }, { deep: true })

// ==================== 把时间统一转成时:分，AI 和用户消息都走这里 ====================
const formatMessageTime = (timeValue) => {
  // 大白话：接口时间可能有，也可能没有，所以这里先做保护，没值就直接显示“刚刚”。
  if (!timeValue) return '刚刚'
  const date = new Date(timeValue)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// ==================== 把聊天窗口滚回最上面 ====================
const resetChatScroll = async () => {
  // 大白话：等 Vue 先把页面更新完，再去改滚动条位置，不然拿到的还是旧 DOM。
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = 0
  }
}

// ==================== 墨点背景动画：下面这一整块和首页是同一套思路 ====================
// 大白话：这几个变量是给 consultation 页的 canvas 墨点动画用的。
let inkCanvas = null
let inkCtx = null
let particlesArray = []
let animationId = 0

// 大白话：让画布宽高跟浏览器窗口同步，不然放大缩小时背景会撑不满。
function initInkCanvas() {
  if (!inkCanvas) return
  inkCanvas.width = window.innerWidth
  inkCanvas.height = window.innerHeight
}

// 大白话：每一个 Particle 都代表一颗慢慢往上漂的小墨点。
class Particle {
  constructor() {
    this.x = Math.random() * inkCanvas.width
    this.y = Math.random() * inkCanvas.height
    this.size = Math.random() * 2 + 0.5
    this.speedX = Math.random() * 0.5 - 0.25
    this.speedY = Math.random() * -1 - 0.5
    this.opacity = Math.random() * 0.5
    this.color = Math.random() > 0.5 ? '0, 0, 0' : '100, 100, 100'
  }

  // 大白话：每一帧都更新小墨点的位置，飘出顶部后就从底部重新进场。
  update() {
    this.x += this.speedX
    this.y += this.speedY

    if (this.y < 0 - this.size) {
      this.y = inkCanvas.height + this.size
      this.x = Math.random() * inkCanvas.width
    }
  }

  // 大白话：把当前这颗墨点真正画到 canvas 上。
  draw() {
    inkCtx.fillStyle = `rgba(${this.color}, ${this.opacity})`
    inkCtx.beginPath()
    inkCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    inkCtx.fill()
  }
}

// 大白话：按屏幕大小批量创建一堆墨点。
function initParticles() {
  particlesArray = []
  const numberOfParticles = (inkCanvas.width * inkCanvas.height) / 30000

  for (let i = 0; i < numberOfParticles; i += 1) {
    particlesArray.push(new Particle())
  }
}

// 大白话：动画主循环，每一帧先清空再重画所有墨点。
function animateInk() {
  if (!inkCtx || !inkCanvas) return
  inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height)

  for (let i = 0; i < particlesArray.length; i += 1) {
    particlesArray[i].update()
    particlesArray[i].draw()
  }

  animationId = requestAnimationFrame(animateInk)
}

// 大白话：窗口大小变化时，画布和粒子数量都要跟着重新算。
function handleInkResize() {
  initInkCanvas()
  initParticles()
}

// ==================== 回车键发送消息（Shift+Enter 换行） ====================
const handleKeyDown = (e) => {
  // 如果按的是 Enter 且没按 Shift，就阻止默认换行行为（改成由发送按钮处理）
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault()
  }
}

// ==================== 用户点击发送按钮 ====================
const sendMessage = () => {
  if (!userMessage.value.trim()) return
  if (isAiTyping.value) return

  const message = userMessage.value.trim()
  userMessage.value = ''

  // 大白话：确保有个会话（刷新后可能没有）。
  if (!currentSession.value) createNewFrontendSession()

  // 把用户消息加到聊天列表
  messages.value.push({
    id: Date.now(),
    senderType: 1,
    content: message,
    createAt: new Date().toISOString()
  })

  // 请求 AI 回复
  startAiResponse(message)
}

// ==================== AI 回复：Cloudflare Workers AI（免费） ====================
const startAiResponse = async (userMessage) => {
  if (isAiTyping.value) return
  isAiTyping.value = true

  const aiMessage = {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    senderType: 2,
    content: '',
    createAt: new Date().toISOString()
  }
  messages.value.push(aiMessage)

  // 拼消息上下文
  const chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }]
  const historyMsgs = messages.value.slice(0, -1)
  historyMsgs.forEach(m => {
    chatMessages.push({
      role: m.senderType === 1 ? 'user' : 'assistant',
      content: m.content
    })
  })

  try {
    const response = await fetch(AI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatMessages })
    })

    if (!response.ok) throw new Error('AI 返回 ' + response.status)

    const data = await response.json()
    if (data && data.content) {
      aiMessage.content = data.content
    } else if (data && data.error) {
      aiMessage.content = 'AI 出错：' + data.error
    } else {
      aiMessage.content = '抱歉，未获取到回复。'
    }
    saveLocalCache()
    isAiTyping.value = false
  } catch (err) {
    handleError(err)
  }
}

// ==================== 错误处理 ====================
const handleError = (error) => {
  const aiMessage = messages.value[messages.value.length - 1]
  if (aiMessage) aiMessage.content = 'AI回复失败，请重试'
  // 大白话：失败文案也要同步写进缓存，避免回到页面时看到空白气泡。
  saveLocalCache()
  isAiTyping.value = false
}


// ==================== 简单换行 ====================
const formatMessageContent = (content) => {
  return content.replace(/\n/g, '<br>')
}

// ==================== 页面一加载就要做的事情 ====================
onMounted(() => {
  // 大白话：进页面先把墨点背景动画启动起来。
  inkCanvas = document.getElementById('consultation-ink-canvas')
  if (inkCanvas) {
    inkCtx = inkCanvas.getContext('2d')
    initInkCanvas()
    initParticles()
    animateInk()
    window.addEventListener('resize', handleInkResize)
  }

  // 大白话：刷新后从浏览器缓存恢复上次对话。
  const cached = restoreLocalCache()
  if (cached && cached.session && cached.session.sessionId) {
    currentSession.value = cached.session
    messages.value = Array.isArray(cached.messages) ? cached.messages : []
    if (messages.value.length === 0) {
      initialMessageTime.value = formatMessageTime(new Date())
    }
    resetChatScroll()
  } else {
    createNewFrontendSession()
  }
})

// 大白话：离开页面时把动画和 resize 监听都停掉，免得一直占内存。
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleInkResize)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>


<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Epilogue:wght@700;800&family=JetBrains+Mono:wght@500&family=Manrope:wght@400;500&display=swap");

.consultation-page {
  height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  background: #f9f9f9;
  color: #1a1c1c;
  color: #1a1c1c;
  font-family: 'Manrope', sans-serif;
  overflow: hidden;
}

/* 大白话：这一层就是整页漂浮墨点背景，只负责特效，不拦截任何点击。 */
.consultation-page__ink-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.consultation-sidebar {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 256px;
  flex: 0 0 256px;
  height: 100vh;
  border-right: 2px solid #1a1c1c;
  padding: 24px;
  background: #f9f9f9;
  overflow: hidden;
}

.consultation-sidebar__top {
  display: flex;
  flex-direction: column;
}

.consultation-brand__badge {
  width: 96px;
  height: 96px;
  margin: 0 auto 16px;
  border: 2px solid #1a1c1c;
  border-radius: 999px;
  overflow: hidden;
  background: #ffffff;
  animation: breathe 3s ease-in-out infinite;
}

.consultation-brand__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.consultation-brand__title {
  margin: 0;
  font-family: 'Epilogue', sans-serif;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
  text-align: center;
}

.consultation-brand__subtitle {
  margin: 4px 0 0;
  color: #4c4546;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
  text-transform: uppercase;
}

.consultation-history {
  margin-top: 32px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.consultation-history__title {
  margin: 0 0 12px;
  color: #4c4546;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.consultation-history__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 4px;
}

.consultation-history__item {
  position: relative;
  display: block;
  width: 100%;
  padding: 10px 12px 10px 12px;
  border: 2px solid transparent;
  border-radius: 4px;
  background: transparent;
  text-align: left;
  transition: all 0.2s ease;
}

.consultation-history__item:hover {
  border-color: #000000;
  background: #eeeeee;
}

.consultation-history__name {
  display: block;
  padding-right: 26px;
  font-size: 16px;
  line-height: 1.5;
  color: #1a1c1c;
}

.consultation-history__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.consultation-history__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #4c4546;
  font-size: 12px;
}

.consultation-history__delete {
  position: absolute;
  top: 10px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #4c4546;
}

.consultation-history__delete:hover {
  background: #000000;
  color: #ffffff;
}

.consultation-sidebar__button {
  position: relative;
  overflow: hidden;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid #000000;
  background: #000000;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 4px;
}

.consultation-main {
  position: relative;
  width: 100%;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 大白话：去掉左侧栏后，聊天区撑满全屏。 */
.consultation-main--full {
  max-width: none;
}

.consultation-main__art {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.consultation-main__art-image {
  position: absolute;
  top: auto;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-image: url("../assets/images/congirl.jpeg");
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: contain;
  opacity: 0.08;
  filter: grayscale(1) contrast(1.05);
  transform: none;
  transform-origin: right bottom;
}

.consultation-chat {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  padding: 40px 28px 32px 36px;
  overflow-y: auto;
  overflow-x: hidden;
}

.consultation-chat__chapter {
  display: flex;
  justify-content: center;
  margin-bottom: 44px;
}

.consultation-chat__chapter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 18px;
  border: 2px solid #1a1c1c;
  border-radius: 12px;
  background: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.consultation-message {
  width: 100%;
  max-width: none;
  margin-bottom: 24px;
}

.consultation-message--user {
  margin-left: auto;
}

.consultation-message__bubble {
  position: relative;
  max-width: 100%;
  padding: 16px 24px;
  border: 2px solid #000000;
  border-radius: 8px;
  background: #ffffff;
  font-size: 16px;
  line-height: 24px;
}

.consultation-message__bubble p {
  margin: 0;
}

.consultation-message__bubble--ai {
  width: calc(100% - 40px);
  border-bottom-left-radius: 4px;
}

.consultation-message__bubble--ai::before {
  content: '';
  position: absolute;
  left: -10px;
  bottom: -2px;
  width: 16px;
  height: 16px;
  border-bottom: 2px solid #000000;
  background: #ffffff;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
}

.consultation-message__bubble--user {
  width: min(100%, 560px);
  margin-left: auto;
  border-bottom-right-radius: 4px;
  background: #000000;
  color: #ffffff;
}

.consultation-message__bubble--user::after {
  content: '';
  position: absolute;
  right: -10px;
  bottom: -2px;
  width: 16px;
  height: 16px;
  border-left: 2px solid #000000;
  border-bottom: 2px solid #000000;
  background: #000000;
  clip-path: polygon(0 0, 100% 100%, 0 100%);
}

.consultation-message__meta {
  margin-top: 8px;
  margin-left: 10px;
  color: #4c4546;
  font-size: 12px;
  line-height: 16px;
}

.consultation-message__meta--user {
  margin-right: 10px;
  margin-left: 0;
  text-align: right;
}

.consultation-message__typing {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.consultation-message__typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1a1c1c;
  animation: typing-bounce 1.3s ease-in-out infinite;
}

.consultation-message__typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.consultation-message__typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

.consultation-message__error {
  color: #991b1b;
}

.consultation-composer {
  border-top: 2px solid #1a1c1c;
  position: relative;
  z-index: 1;
  padding: 24px 64px 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
}

.consultation-composer__bar {
  position: relative;
  width: 100%;
  max-width: none;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 2px solid #000000;
  border-radius: 8px;
  background: #ffffff;
}

.consultation-composer__bar::before {
  content: '';
  position: absolute;
  inset: 8px -8px -8px 8px;
  z-index: -1;
  border: 2px solid #000000;
  background: #efefef;
}

.consultation-composer__attach,
.consultation-composer__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #1a1c1c;
}

.consultation-composer__attach {
  width: 34px;
  height: 34px;
  border: none;
  color: #5e5e5e;
}

.consultation-composer__send {
  width: 42px;
  height: 42px;
  border: 2px solid #000000;
  background: #000000;
  color: #ffffff;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.consultation-composer__send:hover {
  background: #ffffff;
  color: #000000;
}

.consultation-composer__send:disabled {
  opacity: 0.5;
}

.consultation-composer__input {
  width: 100%;
  border: none;
  background: transparent;
  color: #1a1c1c;
  font-size: 16px;
}

.consultation-composer__input:focus {
  outline: none;
}

.consultation-composer__input::placeholder {
  color: #7a7a7a;
}

.consultation-composer__caption {
  margin: 14px 0 0;
  color: #4c4546;
  font-size: 12px;
  text-align: center;
}

.consultation-message__bubble :deep(.markdown-body) {
  background: transparent;
  color: inherit;
}

.consultation-message__bubble :deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .consultation-page {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .consultation-sidebar {
    width: 100%;
    height: auto;
    min-height: auto;
    border-bottom: 2px solid #1a1c1c;
    border-right: none;
    overflow: visible;
  }

  .consultation-history__list {
    max-height: 220px;
  }

  .consultation-chat {
    padding: 28px 20px 30px;
    overflow: visible;
  }

  .consultation-composer {
    padding: 20px 18px 16px;
  }

  .consultation-main__art-image {
    width: 44%;
    height: 54%;
    opacity: 0.08;
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}
</style>
