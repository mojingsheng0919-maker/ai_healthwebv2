<template>
  <div class="consultation-container">
    <div class="sidebar">
      <!-- AI助手信息 -->
      <div class="ai-assistant-info">
        <div class="breathing-circle">
          <el-image :src="iconUrl" style="width: 25px;height:25px" alt="AI助手" />
        </div>
        <h3 class="assistant-name">宁渡AI助手</h3>
        <div class="online-status">
          <div class="status-dot"></div>
          在线服务中
        </div>
      </div>
      <!-- 情绪花园 -->
    <div class="emotion-garden">
        <div class="garden-header">
            <div class="garden-title">情绪花园</div>
        </div>
        <div class="emotion-info">
            <div class="emotion-name">中性</div>
         <div class="emotion-score">50</div>
        </div>
      <div class="warm-tips">
  <div class="emotion-status-text">
    <span class="status-label">今天感觉</span>
    <span class="status-emotion">{{ currentEmotion.isNegative ? '需要关注' : '很不错' }}</span>
  </div>
  <div class="emotion-intensity">
    <span class="intensity-dots">
      <span v-for="dot in 3" :key="dot" class="dot" :class="{ active: getIntensityClass(currentEmotion.emotionScore) >= dot }"></span>
    </span>
    <span class="intensity-text">
      {{ getRiskText(currentEmotion.riskLevel) }}
    </span>
  </div>

  <!-- 温暖建议卡片 -->
  <div class="warm-suggestion" v-if="currentEmotion.suggestion">
    <div class="suggestion-icon">💖</div>
    <div class="suggestion-content">
      <div class="suggestion-title">给你的小建议</div>
      <div class="suggestion-text">{{ currentEmotion.suggestion }}</div>
    </div>
  </div>
</div>
    </div>
      <!-- 会话列表 -->
<div class="session-history">
  <h4 class="section-title">会话列表</h4>
  <div class="session-list">
    <div v-for="session in sessionList" :key="session.id" @click="handleSessionClick(session)" class="session-item">
      <div class="session-info">
        <div class="session-title">
          <span>{{ session.sessionTitle }}</span>
          <div class="session-meta">
            <span class="session-time">{{ session.startedAt }}</span>
          </div>
          <div class="session-preview">
            {{ session.lastMessageContent }}
          </div>
          <div class="session-stats">
            <span>
              <el-icon>
                <ChatRound />
              </el-icon>
              {{ session.messageCount || 0 }}
            </span>
            <span>
              <el-icon>
                <Clock />
              </el-icon>
              {{ session.durationMinutes || 0 }}分钟
            </span>
          </div>
        </div>
        <div class="session-actions">
            <el-button text type="danger" size="small" @click="handleDeleteSession(session.id)">
                <el-icon>
                  <DeleteFilled />
                </el-icon>
            </el-button>
        </div>
      </div>
    </div>
  </div>
</div>
    </div>
    <div class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <div class="chat-avatar">
            <el-image :src="iconUrl1" style="width: 30px;height:30px" />
          </div>
          <div class="chat-info">
            <h2>宁渡AI助手</h2>
            <p>您的贴心AI心理健康助手</p>
          </div>
        </div>
        <el-button circle @click="createNewFrontendSession" title="新建会话">
          <el-icon>
            <Plus />
          </el-icon>
        </el-button>
      </div>
      <!-- 聊天消息区域 -->
      <div class="chat-messages">
        <!-- 欢迎用语 -->
        <div class="message-item ai-message" v-if="messages.length === 0">
          <div class="message-avatar">
            <el-image :src="iconUrl" style="width: 18px;height: 18px" />
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <p>您好！我是小暖，您的AI心理健康助手。很高兴陪伴您，为您提供温暖的心理支持。请告诉我，今天您感觉怎么样？有什么想要分享的吗？</p>
            </div>
            <div class="message-time">刚刚</div>
          </div>
        </div>
       <!-- 消息列表 -->
        <div v-for="msg in messages" :key="msg.id" class="message-item" :class="msg.senderType === 1 ? 'user-message' : ''">
            <div class="message-avatar">
                <el-image v-if="msg.senderType === 1" style="width: 18px; height: 18px" :src="iconUrl2"></el-image>
                <el-image v-if="msg.senderType === 2" style="width: 18px; height: 18px" :src="iconUrl"></el-image>
            </div>
            <div class="message-content">
            <div class="message-bubble">
            <!-- AI正在思考中 -->
            <div v-if="msg.senderType === 2 && isAiTyping && !msg.content" class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <!-- AI错误提示 -->
            <div v-else-if="msg.isError" class="error-message">
                <p>{{ msg.content }}</p>
            </div>
            <!-- AI正常返回消息 -->
            <MarkdownRenderer v-else-if="msg.senderType === 2 && !msg.isError" :content="msg.content" :is-ai-message="true" />
            <p v-else-if="msg.content" v-html="formatMessageContent(msg.content)"></p>
  </div>
</div>
        </div>
      </div>
      <!-- 用户输入区域 -->
    <div class="chat-input">
  <div class="input-container">
    <el-input
      v-model="userMessage"
      placeholder="请输入您想要分享的内容..."
      type="textarea"
      :rows="3"
      :disabled="isAiTyping"
      class="message-input"
      @keydown="handleKeyDown"
      clearable
    />
    <div class="input-footer">
  <span>按Enter发送，Shift+Enter换行</span>
  <span>{{ userMessage.length }} / 500</span>
</div>
  </div>
  <el-button :disabled="!userMessage.trim() || userMessage.length > 500" type="primary" class="send-btn" @click="sendMessage" @keyup.enter="sendMessage">
    <el-icon>
      <Promotion />
    </el-icon>
  </el-button>
</div>
    </div>
  </div>
</template>

<script setup>
// ==================== 导入依赖 ====================
// vue 核心：ref 响应式变量、onMounted 页面加载完执行
import { ref , onMounted } from 'vue'
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


// ==================== 新建临时会话（还没发给后端，只是前端先搭一个空壳） ====================
const createNewFrontendSession = () => {
  // 创建一个新的会话对象
  const newSession = {
    sessionId: `temp_${Date.now()}`, // 用时间戳生成临时 ID
    status: 'TEMP', // 标记为临时会话，等发了消息才变正式
    sessionTitle: '新对话' // 暂时叫“新对话”
  }
  currentSession.value = newSession // 把当前会话指向这个新壳子
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

// 标记 AI 是否正在打字中，正在打字时输入框不能用
const isAiTyping = ref(false)

// ==================== 情绪花园：当前会话的情绪分析结果 ====================
// 这个对象放后端对这次聊天做出的情绪评估
const currentEmotion = ref({
  primaryEmotion: '中性', // 主要情绪是什么
  emotionScore: 50, // 情绪评分（分值越高代表越好）
  isNegative: false, // 是否属于负面情绪
  riskLevel: 0, // 风险等级：0 正常、1 关注、2 预警、3 危机
  suggestion: '保持正常状态', // AI 给的小建议
})

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
  getSessionPage() // 先拉一下左边的历史会话列表
  createNewFrontendSession() // 同时创建一个新的临时会话，让用户马上就能聊
})
</script>


<style scoped lang="scss">
.consultation-container {
    margin: 0 auto;
    width: 1200px;
    display: flex;
    gap: 20px;
    padding: 20px;
    .sidebar {
        width: 320px;
        .ai-assistant-info {
            margin-bottom: 20px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(251, 146, 60, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(251, 146, 60, 0.08);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            .breathing-circle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
                animation: breathing 4s ease-in-out infinite;
                box-shadow: 0 6px 24px rgba(251, 146, 60, 0.25);
                position: relative;
            }
            .assistant-name {
                font-size: 16px;
                font-weight: 700;
                background: linear-gradient(135deg, #fb923c, #f59e0b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-align: center;
                background-clip: text;
                margin: 0 0 12px;
            }
            .online-status {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #059669;
                font-size: 12px;
                font-weight: 600;
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #059669;
                    border-radius: 50%;
                    margin-right: 8px;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 8px rgba(5, 150, 105, 0.4);
                }
            }
        }
        .session-history {
            background: white;
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            min-height: 250px;
            display: flex;
            flex-direction: column;
            .section-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin: 0 0 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                
            }
            .session-list {
                overflow-y: auto;
                max-height: 200px;
                scrollbar-width: thin;
                scrollbar-color: rgba(64, 150, 255, 0.3) transparent;
                .session-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    &:hover {
                        background: #f8f9ff;
                        border-color: #e6f0ff;
                    }
                    &.active {
                        background: #e6f0ff;
                        border-color: #4096ff;
                    }
                    .session-info {
                        flex: 1;
                        .session-title {
                            font-weight: 500;
                            font-size: 14px;
                            color: #333;
                            margin-bottom: 4px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            .session-meta {
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 6px;
                                .session-time {
                                    font-size: 12px;
                                    color: #999;
                                }
                            }
                            .session-preview {
                                width: 200px;
                                font-size: 12px;
                                color: #666;
                                margin-bottom: 6px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .session-stats {
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                span {
                                    font-size: 12px;
                                    color: #999;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                }
                            }
                        }
                        .session-actions {
                            position: absolute;
                            top: 10px;
                            right: 12px;
                        }
                    }
                }
                .no-sessions-text {
                    text-align: center;
                    font-size: 14px;
                    color: #999;
                }
            }
        }
        .emotion-garden {
            background: linear-gradient(135deg, #fef9e7 0%, #fcf4e6 50%, #f6f0e8 100%);
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(252, 244, 230, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            min-height: 300px;
            
            .garden-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                position: relative;
                z-index: 2;
                .garden-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #8b4513;
                }
            }
            .emotion-info {
                margin: 0 auto;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.8);
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                color: #fff;
                .emotion-name {
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1;
                    margin-bottom: 2px;
                }
                .emotion-score {
                    font-size: 14px;
                    font-weight: 700;
                    opacity: 0.9;
                }
            }
            .warm-tips {
                text-align: center;
                margin-bottom: 16px;
                .emotion-status-text {
                    margin-bottom: 12px;
                    .status-label {
                        font-size: 14px;
                        color: #8b7355;
                        margin-right: 8px;
                    }
                    .status-emotion {
                        font-size: 16px;
                        font-weight: 600;
                        padding: 4px 12px;
                        border-radius: 16px;
                        display: inline-block;
                    }
                }
                .emotion-intensity {
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    .intensity-dots {
                        display: flex;
                        gap: 4px;
                        .dot {
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: #e0e0e0;
                            transition: all 0.3s ease;
                            &.active {
                                background: linear-gradient(135deg, #ff9a9e, #fecfef);
                                transform: scale(1.2);
                                box-shadow: 0 2px 8px rgba(255, 154, 158, 0.4);
                            }
                        }
                    }
                    .intensity-text {
                        font-size: 12px;
                        color: #8b7355;
                        font-weight: 500;
                    }
                }
                .warm-suggestion {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
                    border-radius: 16px;
                    padding: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
                    .suggestion-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .suggestion-content {
                        text-align: left;
                        flex: 1;
                        .suggestion-title {
                            font-size: 14px;
                            font-weight: 600;
                            color: #8b7355;
                            margin-bottom: 6px;
                        }
                        .suggestion-text {
                            font-size: 13px;
                            color: #6b5b47;
                            line-height: 1.5;
                        }
                    }
                }
                .healing-actions {
                    margin-bottom: 16px;
                    .actions-title {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #8b7355;
                        margin-bottom: 16px;
                    }
                    .actions-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        .action-item {
                            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
                            border-radius: 12px;
                            padding: 12px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            border: 1px solid rgba(255, 255, 255, 0.5);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                            text-align: left;
                            .action-icon {
                                font-size: 14px;
                                color: #ffd700;
                                flex-shrink: 0;
                            }
                            .action-text {
                                font-size: 12px;
                                color: #6b5b47;
                                line-height: 1.4;
                                flex: 1;
                            }
                        }
                    }
                }
                .risk-notice {
                    background: linear-gradient(135deg, #fff9e6, #ffeaa7);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    border: 1px solid rgba(255, 234, 167, 0.6);
                    box-shadow: 0 6px 20px rgba(255, 234, 167, 0.3);
                    .notice-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .notice-content {
                        flex: 1;
                        .notice-title {
                            font-size: 14px;
                            font-weight: 600;
                            color: #d4840f;
                            margin-bottom: 6px;
                        }
                        .notice-text {
                            font-size: 13px;
                            color: #b8740c;
                            line-height: 1.5;
                        }
                    }
                }
            }
        }
    }
    .chat-main {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 252, 250, 0.98) 100%);
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(251, 146, 60, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(251, 146, 60, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        .chat-header {
            background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            flex-shrink: 0;
            .header-left {
                display: flex;
                align-items: center;
                .chat-avatar {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 1;
                }
                .chat-info {
                    h2 {
                        font-size: 20px;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    p {
                        font-size: 14px;
                    }
                }
            }
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 252, 248, 0.05) 100%);
            min-height: 0;
            max-height: calc(100vh - 200px);
            scrollbar-width: thin;
            scrollbar-color: rgba(251, 146, 60, 0.3) transparent;
            .message-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                .message-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: white;
                    flex-shrink: 0;
                }
                &.ai-message {
                    .message-avatar {
                        background: linear-gradient(135deg, #fb923c, #f59e0b);
                        box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
                    }
                }
                &.user-message {
                    .message-avatar {
                        background: linear-gradient(135deg, #6b7280, #4b5563);
                        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                    }
                }
                .message-content {
                    max-width: 70%;
                    .message-bubble {
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
                        border-radius: 16px;
                        padding: 12px 16px;
                        position: relative;
                        animation: fadeInUp 0.4s ease-out;
                        border: 1px solid rgba(251, 146, 60, 0.1);
                        box-shadow: 0 4px 16px rgba(251, 146, 60, 0.05);
                        .typing-indicator {
                            display: flex;
                            gap: 4px;
                            padding: 8px 0;
                            .typing-dot {
                                width: 8px;
                                height: 8px;
                                background: #ccc;
                                border-radius: 50%;
                                animation: typing 1.5s ease-in-out infinite;
                                &:nth-child(2) {
                                    animation-delay: 0.2s;
                                }
                                &:nth-child(3) {
                                    animation-delay: 0.4s;
                                }   
                            }
                        }
                        /* 错误消息样式 */
                        .error-message {
                            background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%);
                            border: 1px solid #F87171;
                            border-radius: 12px;
                            padding: 12px 16px;
                            color: #991B1B;
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                    }
                    .message-time {
                        font-size: 12px;
                        color: #999;
                        margin-top: 4px;
                    }
                }
            }
        }
        .chat-input {
            border-top: 1px solid rgba(251, 146, 60, 0.1);
            padding: 20px 24px;
            display: flex;
            gap: 12px;
            align-items: flex-end;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 252, 248, 0.7) 100%);
            backdrop-filter: blur(10px);
            flex-shrink: 0;
            .input-container {
                flex: 1;
            }
            .input-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #78716c;
                font-weight: 500;
            }
            .send-btn {
                height: 60px;
                width: 60px;
                border-radius: 16px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%) !important;
                border: none !important;
                box-shadow: 0 6px 20px rgba(251, 146, 60, 0.25);
                transition: all 0.3s ease;
            }

        }

    }
}

</style>
