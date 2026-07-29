<template>
  <div class="consultation-page">
    <!-- 大白话：这个 canvas 和首页一样，专门负责整页漂浮的小墨点背景 -->
    <canvas id="consultation-ink-canvas" class="consultation-page__ink-canvas"></canvas>

    <aside class="consultation-sidebar">
      <div class="consultation-sidebar__top">
        <div class="consultation-brand">
          <div class="consultation-brand__badge">
            <img src="../assets/images/kokoro.png" alt="AI助手" class="consultation-brand__image" />
          </div>
          <h1 class="consultation-brand__title">Kokoro-kun</h1>
          <p class="consultation-brand__subtitle">Online &amp; Listening</p>
        </div>

        <section v-if="Array.isArray(sessionList) && sessionList.length" class="consultation-history">
          <h2 class="consultation-history__title">Recent Sessions</h2>
          <div class="consultation-history__list">
            <button
              v-for="session in sessionList || []"
              :key="session.id"
              type="button"
              class="consultation-history__item"
              @click="handleSessionClick(session)"
            >
              <span class="consultation-history__name">{{ session.sessionTitle }}</span>
              <span class="consultation-history__meta">
                <span class="consultation-history__meta-item">
                  <el-icon><ChatRound /></el-icon>
                  {{ session.messageCount || 0 }}
                </span>
                <span class="consultation-history__meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ session.durationMinutes || 0 }}
                </span>
              </span>
              <span class="consultation-history__delete" @click.stop="handleDeleteSession(session.id)">
                <el-icon><DeleteFilled /></el-icon>
              </span>
            </button>
          </div>
        </section>
      </div>

      <button class="consultation-sidebar__button" type="button" @click="createNewFrontendSession">
        <el-icon><Plus /></el-icon>
        <span>New Session</span>
      </button>
    </aside>

    <main class="consultation-main">
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
import { ref , onMounted, onBeforeUnmount, nextTick } from 'vue'
// 从接口文件里拿会话相关的方法
import { StartSession , getSessionList , deleteSession , getSessionDetail , getSessionEmotion } from '@/api/frontend'
// Element Plus 消息提示
import { ElMessage } from 'element-plus'
// Markdown 渲染组件，把 AI 回复的 markdown 文字转成带格式的样子
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
// fetchEventSource：用 SS E 流式的方式读取 AI 回复（一句话一句话往外蹦）
import { fetchEventSource } from '@microsoft/fetch-event-source'

// ==================== 三张图标图片的路径 ====================
// robot-fill.png：AI 助手的头像
const iconUrl = new URL('@/assets/images/robot-fill.png', import.meta.url).href// 图标路径
// like.png：顶部的点赞图标
const iconUrl1 = new URL('@/assets/images/like.png', import.meta.url).href// 图标路径
// users.png：用户自己的头像
const iconUrl2 = new URL('@/assets/images/users.png', import.meta.url).href// 图标路径

// ==================== 一些默认值单独拎出来，后面重置界面时直接复用 ====================
// 大白话：新建对话时，情绪卡和欢迎语时间都要回到最初状态，所以先存一个默认对象出来。
const defaultEmotionState = {
  primaryEmotion: '中性',
  emotionScore: 50,
  isNegative: false,
  riskLevel: 0,
  suggestion: '保持正常状态'
}


// ==================== 新建临时会话（还没发给后端，只是前端先搭一个空壳） ====================
const createNewFrontendSession = () => {
  // 创建一个新的会话对象
  const newSession = {
    sessionId: `temp_${Date.now()}`, // 用时间戳生成临时 ID
    status: 'TEMP', // 标记为临时会话，等发了消息才变正式
    sessionTitle: '新对话' // 暂时叫“新对话”
  }

  currentSession.value = newSession // 把当前会话指向这个新壳子
  // 大白话：点“新对话”时，不只是标题变一下，右边聊天区也要彻底回到初始欢迎界面。
  messages.value = []
  userMessage.value = ''
  isAiTyping.value = false
  currentEmotion.value = { ...defaultEmotionState }
  initialMessageTime.value = formatMessageTime(new Date())
  resetChatScroll()
}

// ==================== 页面上的数据（响应式变量） ====================

// 当前解析当前正在聊的会话对象（可能是临时的，也可能是从后端拖回来的历史会话）
const currentSession = ref(null)
// 左侧会话列表，放从后端拿回来的所有历史会话
const sessionList = ref([])

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

// ==================== 情绪花园：当前会话的情绪分析结果 ====================
// 这个对象放后端对这次聊天做出的情绪评估
const currentEmotion = ref({ ...defaultEmotionState })

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

// ==================== 根据会话 ID 请求后端拿情绪分析结果 ====================
const loadSessionEmotion = (sessionId) => {
  // 确保sessionId格式正确（后端存的 ID 可能带也可能不带 session_ 前缀）
  const id = sessionId.toString().startsWith('session_') ? sessionId : `session_${sessionId}`
  // 调接口拿情绪数据，把结果存到 currentEmotion 里
  getSessionEmotion(id).then(res => {
    currentEmotion.value = res

  })
}

// ==================== 情绪强度等级（用来控制情绪花园里那几个小圆点亮几个） ====================
const getIntensityClass = (score) => {
  // 分数越高点亮的圆点越多
  if (score >= 61) {
    return 3 // 高分亮 3 个圆点
  }
  if (score >= 31) {
    return 2 // 中等亮 2 个圆点
  }
  return 1 // 低分只亮 1 个
}

// ==================== 风险等级转成中文显示 ====================
const getRiskText = (level) => {
  switch (level) {
    case 0:
      return '正常'
    case 1:
      return '关注'
    case 2:
      return '预警'
    case 3:
      return '危机'
    default:
      return '正常'
  }
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
  // 输入框为空就不发
  if (!userMessage.value.trim()) return

  // AI 还在回复中就不能再发了
  if (isAiTyping.value) {
    ElMessage.error('AI助手正在输入中，请稍后')
    return
  }

  // 把输入的内容去掉首尾空格保存下来
  const message = userMessage.value.trim()
  userMessage.value = '' // 清空输入框

  // 如果当前会话是临时会话，说明这是用户第一次发消息，要先创建正式会话
  if (currentSession.value.status === 'TEMP') {
    startNewSession(message)
  }else{
    // 继续现有会话：先把用户消息加到聊天列表，再请求 AI 回复
messages.value.push({
  id: Date.now(),
  senderType: 1, // 1 是用户
  content: message,
  createAt: new Date().toISOString()
})

// 请求 AI 回复
startAiResponse(currentSession.value.sessionId, message)
  }
}

// ==================== 创建新会话（调后端接口，拿到正式 sessionId） ====================
const startNewSession = (message) => {
  // 构建会话参数（发给后端用的）
  const sessionParams = {
    initialMessage: message // 第一条消息就是用户刚输入的内容
  }
  // 如果当前标题还是“新对话”，就生成一个有日期的新标题
  if (currentSession.value.sessionTitle === '新对话') {
    sessionParams.sessionTitle = `宁渡AI助手 - ${new Date().toLocaleString()}`
  } else {
    // 如果历史会话记录，直接用原来的标题
    sessionParams.sessionTitle = currentSession.value.sessionTitle
  }
  // 调用后端接口创建新会话
  StartSession(sessionParams).then(res => {
    console.log(res)
    // 将后端返回的数据转为前端会话格式（合并到 currentSession 里）
    const sessionData = {
      sessionId: res.sessionId,
      status: res.status,
      sessionTitle: sessionParams.sessionTitle
    }
    // 如果当前是临时会话，直接更新现有对象（保留对象引用不变）
    if (currentSession.value && currentSession.value.status === 'TEMP') {
      // 更新为正式会话
      Object.assign(currentSession.value, sessionData)
    } else {
      // 否则，创建一个新的会话
      currentSession.value = sessionData
    }

    // 刷新左侧会话列表
    getSessionPage()

    // 把用户的第一条消息显示在聊天区域
messages.value.push({
  id: Date.now(),
  senderType: 1, // 1 是用户
  content: message,
  createAt: new Date().toISOString()
})
    // 调用流式对话接口，让 AI 开始回复
    startAiResponse(currentSession.value.sessionId , message)

  })
}
// ==================== 流式对话：请求 AI 回复（用 SSE 方式，AI 一个字一个字往外蹦） ====================
const startAiResponse = (sessionId, userMessage) => {
  // 防止重复发送
  if (isAiTyping.value) {
    ElMessage.error('AI助手正在输入中，请稍后')
    return
  }

  // 标记 AI 开始打字，输入框变灰
  isAiTyping.value = true

  // 先在聊天列表里插一条 AI 消息的空壳（content 是空的，等流式返回时一点一点往里填）
  const aiMessage = {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一 ID
    senderType: 2, // 2 是 AI
    content: '', // 一开始是空的，后面流式返回时拼进来
    createAt: new Date().toISOString()
  }
  messages.value.push(aiMessage)

  // 调用流式接口（SSE：Server-Sent Events）
  const ctrl = new AbortController() // 用来中止fetch请求
  fetchEventSource('/api/psychological-chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': localStorage.getItem('token'), // 从本地缓存拿登录 token
      'Accept': 'text/event-stream' // 告诉后端我们要流式数据
    },
    body: JSON.stringify({
      sessionId, // 当前会话 ID
      userMessage // 用户输入的内容
    }),
    signal: ctrl.signal, // 允许我们主动中止这个请求
    // 流连接打开时的回调
    onopen: (response) => {
      console.log(response)
      if (response.headers.get('Content-Type') !== 'text/event-stream') {
        ElMessage.error('服务器返回非流式数据')
      }
    },
    // 每收到一段新数据的时候就调用这个回调
    onmessage: (event) => {
      const raw = event.data.trim() // 服务器发来的原始文本
      if (!raw) return // 空数据就跳过
      const eventName = event.event // event.event 是 SSE 规范里的事件名
      // 拿到聊天列表最后一条 AI 消息
      const aiMessage = messages.value[messages.value.length - 1]

      // 如果收到 done 事件，说明 AI 已经说完了
      if (eventName === 'done') {
        isAiTyping.value = false // 解除输入框锁定
        ctrl.abort() // 中止 SSE 连接
        // 开始情绪分析：根据这次聊天内容分析用户情绪
        loadSessionEmotion(sessionId)
        return
      }
      // 把服务器发来的文本解析成 JSON
      const payload = JSON.parse(raw)
      const ok = String(payload.code) === '200' // 是否成功
      if (ok && payload.data && payload.data.content) {
        // 成功：把这次返回的文字内容拼到 AI 消息后面
        aiMessage.content += payload.data.content
      } else if (!ok) {
        // 错误回复的显示
        handleError(payload.message || 'AI回复失败')
      }
    },
    // 流连接发生错误时的回调
    onerror: (err) => {
      handleError(err || 'AI回复失败')
      throw err // 把错误继续往外抛，让 fetchEventSource 内部处理重连
    },
    // 流连接关闭时的回调
    onclose: () => {
      // 开始情绪分析：不管正常结束还是异常关闭，都拿一下情绪数据
      loadSessionEmotion(sessionId)
    }
  })
}

// ==================== 错误处理函数（把 AI 回复改成错误提示） ====================
const handleError = (error) => {
  // 拿到聊天列表里最后一条 AI 消息，把它改成错误文案
  const aiMessage = messages.value[messages.value.length - 1]
  if (aiMessage) {
    aiMessage.content = 'AI回复失败，请重试'
  }
  isAiTyping.value = false // 解除输入框锁定
  ElMessage.error('AI回复失败，请重试')
}


// ==================== 从后端拿会话列表（左侧显示） ====================
const getSessionPage = () => {
  getSessionList({
    pageNum: 1, // 第 1 页
    pageSize: 10 // 每页 10 条
  }).then(res => {
    console.log(res)
    // 将后端返回的数据转为前端会话格式，塞到左侧列表里
    sessionList.value = res.records

  })
}

// ==================== 用户点击左侧某个历史会话 ====================
const handleSessionClick = (session) => {
  // 根据会话 ID 去后端拉这个会话里的所有聊天消息
  getSessionDetail(session.id).then(res => {
    messages.value = res // 替换右边聊天区的内容
    resetChatScroll()
  })
  // 同时加载这个会话对应的情绪分析结果
  loadSessionEmotion(session.id)
  // 更新当前会话对象数据（把点击的历史会话变成当前正在聊的）
  const sessionData = {
    sessionId: "session_" + session.id,
    status: 'ACTIVE', // 历史会话都是正式会话
    sessionTitle: session.sessionTitle
  }
  currentSession.value = sessionData
}

// ==================== 删除某个历史会话 ====================
const handleDeleteSession = (sessionId) => {
  // 调用后端接口删除会话
  deleteSession(sessionId).then(res => {
    ElMessage.success('删除成功')
    // 删除后重新刷新一下左侧会话列表
    getSessionPage()
  })
}

// ==================== 简单换行：把文本里的换行符 \n 转成 HTML 的 <br> ====================
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

  getSessionPage() // 先拉一下左边的历史会话列表
  createNewFrontendSession() // 同时创建一个新的临时会话，让用户马上就能聊
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
  grid-template-columns: 256px minmax(0, 1fr);
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
