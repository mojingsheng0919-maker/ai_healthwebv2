<template>
  <div class="login-page">
    <!-- 大白话：这个 canvas 和 Home 页面一样，专门负责整页漂浮的小墨点背景 -->
    <canvas id="login-ink-canvas" class="login-page__ink-canvas"></canvas>
    <!-- 大白话：左右两边这两朵花只是装饰背景，不参与页面交互 -->
    <!-- 大白话：这一层是登录页中间的大卡片，左边插画，右边表单 -->
    <main class="login-page__main">
      <!-- 大白话：左边这块是插画展示区，桌面端显示，手机端先隐藏 -->
      <section class="login-page__art manga-panel">
        <!-- 大白话：这一层是点阵背景，用来做漫画纸质感 -->
        <div class="login-page__art-pattern"></div>

        <!-- 大白话：这里就是你要的女生图片 -->
        <img :src="girlImage" alt="girl" class="login-page__art-image" />

        <!-- 大白话：右下角这块小白卡是插画区的说明文案 -->
        <div class="login-page__art-copy">
          <h2 class="login-page__art-title">Welcome Back.</h2>
          <p class="login-page__art-text">Your healing journey continues here.</p>
        </div>
      </section>

      <!-- 大白话：右边这块是真正的登录表单区域 -->
      <section class="login-page__panel login-page__panel--clean manga-panel">
        <!-- 大白话：这里是表单上面的品牌标题 -->
        <div class="login-page__header">
          <router-link class="login-page__back-home" to="/">
            Back Home
          </router-link>
          <h1 class="login-page__brand">Kokoro AI</h1>
          <p class="login-page__sub-brand">Mangaka Edition</p>
        </div>

        <!-- 大白话：这里继续沿用 Element Plus 表单校验，只是把外观换成新样式 -->
        <el-form ref="ruleFormRef" :model="formData" :rules="rules" class="login-form" label-position="top">
          <!-- 大白话：用户名输入这一组 -->
          <div class="login-form__group">
            <div class="login-form__label-row">
              <label class="login-form__label" for="login-username">Username</label>
            </div>
            <el-form-item class="login-form__item" prop="username">
              <el-input
                id="login-username"
                v-model="formData.username"
                class="login-form__input"
                placeholder="请输入用户名"
                size="large"
              />
            </el-form-item>
          </div>

          <!-- 大白话：密码输入这一组 -->
          <div class="login-form__group">
            <div class="login-form__label-row">
              <label class="login-form__label" for="login-password">Password</label>
              <router-link class="login-form__helper" to="/register">Forgot?</router-link>
            </div>
            <el-form-item class="login-form__item" prop="password">
              <el-input
                id="login-password"
                v-model="formData.password"
                class="login-form__input"
                placeholder="请输入密码"
                show-password
                size="large"
                type="password"
              />
            </el-form-item>
          </div>

          <!-- 大白话：登录按钮放在这里，点一下就走原来的 submitForm -->
          <div class="login-form__action">
            <el-button class="login-form__button" size="large" type="primary" @click="submitForm">
              Login
              <span class="material-symbols-outlined login-form__button-icon">arrow_forward</span>
            </el-button>
          </div>
        </el-form>

        <!-- 大白话：底部这一句是去注册的入口 -->
        <div class="login-page__footer">
          <p class="login-page__footer-text">
            New to Kokoro?
            <router-link class="login-page__footer-link" to="/register">
              Create an account
            </router-link>
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/admin'

const router = useRouter()
const ruleFormRef = ref(null)
const girlImage = new URL('@/assets/images/girl.png', import.meta.url).href
const flowerImage = new URL('@/assets/images/flower.png', import.meta.url).href
let canvas = null
let ctx = null
let dots = []
let animationId = 0

const formData = reactive({
  username: '',
  password: ''
})

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名或邮箱' }
  ],
  password: [
    { required: true, message: '请输入密码' }
  ]
})

// 大白话：这个函数专门让登录页背景画布跟着窗口一起变大变小
const initCanvas = () => {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// 大白话：每一个 Dot 都代表背景里一颗会慢慢漂浮的小点
class Dot {
  constructor() {
    this.reset(true)
    this.phase = Math.random() * Math.PI * 2
  }

  // 大白话：这里是给小点重新随机一个位置和速度，飘出屏幕后会再次复用
  reset(initial = false) {
    this.x = Math.random() * (canvas?.width || window.innerWidth)
    this.y = initial
      ? Math.random() * (canvas?.height || window.innerHeight)
      : (canvas?.height || window.innerHeight) + Math.random() * 40
    this.size = Math.random() * 2.2 + 0.8
    this.speedX = Math.random() * 0.35 - 0.175
    this.speedY = -(Math.random() * 0.7 + 0.25)
    this.baseOpacity = Math.random() * 0.18 + 0.08
    this.breatheSpeed = Math.random() * 0.03 + 0.01
  }

  // 大白话：每一帧都更新一下位置和透明度，让它看起来像在呼吸
  update() {
    this.x += this.speedX
    this.y += this.speedY
    this.phase += this.breatheSpeed

    if (this.y < -this.size) {
      this.reset()
    }
  }

  // 大白话：真正把这一颗小点画到画布上
  draw() {
    const opacity = this.baseOpacity + Math.sin(this.phase) * 0.08
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(opacity, 0.04)})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 大白话：按屏幕大小批量生成一组小点，屏幕越大点也会更多
const initDots = () => {
  dots = []
  const total = Math.max(48, Math.floor((canvas.width * canvas.height) / 22000))

  for (let i = 0; i < total; i += 1) {
    dots.push(new Dot())
  }
}

// 大白话：动画主循环，每一帧先清空画布，再把所有小点重新画一遍
const animateDots = () => {
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < dots.length; i += 1) {
    dots[i].update()
    dots[i].draw()
  }

  animationId = requestAnimationFrame(animateDots)
}

// 大白话：窗口大小变化时，画布尺寸和小点数量都重新算一遍
const handleResize = () => {
  initCanvas()
  initDots()
}

// 大白话：登录按钮点下去以后，先走表单校验，校验过了再请求后端接口
const submitForm = async () => {
  const formEl = ruleFormRef.value
  if (!formEl) return

  await formEl.validate((valid, fields) => {
    if (valid) {
      login(formData).then(data => {
        if (!data.token) return console.error('登录失败')
        localStorage.setItem('token', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo))

        if (data.userInfo.userType === 2) {
          router.push('/back/dashboard')
        } else {
          router.push('/')
        }
      })
    } else {
      console.log(fields)
    }
  })
}

onMounted(() => {
  canvas = document.getElementById('login-ink-canvas')
  if (!canvas) return

  ctx = canvas.getContext('2d')
  initCanvas()
  initDots()
  animateDots()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped lang="scss">
/* 大白话：先把这个页面会用到的字体和图标引进来 */
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Epilogue:wght@700;800&family=JetBrains+Mono:wght@500&family=Manrope:wght@400;500&display=swap");

/* 大白话：这一段是整个登录页的总外壳，颜色、间距变量都放这里 */
.login-page {
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-surface-low: #eeeeee;
  --color-text: #1a1c1c;
  --color-text-soft: #5e5e5e;
  --color-text-muted: #4c4546;
  --color-border: #000000;
  --space-mobile: 16px;
  --space-gutter: 24px;
  --space-desktop: 64px;
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--space-mobile);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: 'Manrope', sans-serif;
}

/* 大白话：这层是登录页的背景画布，专门用来画会呼吸的小墨点 */
.login-page__ink-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.9;
}

/* 大白话：这两朵花固定在页面左右两边，当成背景装饰，不会挡住中间表单 */
.login-page__flower {
  position: fixed;
  top: 50%;
  z-index: 0;
  width: 220px;
  height: 520px;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.18;
  transform: translateY(-50%);
}

.login-page__flower--left {
  left: 18px;
}

.login-page__flower--right {
  right: 18px;
  transform: translateY(-50%) scaleX(-1);
}

/* 大白话：中间这个大卡片采用左右双栏布局 */
.login-page__main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1280px;
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 16px;
}

/* 大白话：左边插画区这一块，手机先隐藏，桌面端再显示 */
.login-page__art {
  display: none;
  min-height: 620px;
  position: relative;
  overflow: hidden;
  border-right: 0;
  background-color: var(--color-surface);
}

/* 大白话：这层点阵背景就是仿漫画纸的颗粒纹理 */
.login-page__art-pattern {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: radial-gradient(rgba(76, 69, 70, 0.35) 1.5px, transparent 1.5px);
  background-size: 8px 8px;
  opacity: 0.15;
}

/* 大白话：女生图本体铺满整个插画区 */
.login-page__art-image {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.92;
  mix-blend-mode: multiply;
  transition: transform 0.35s ease;
}

.login-page__art:hover .login-page__art-image {
  transform: translate(-14px, -14px);
}

/* 大白话：这是插画区右下角的白色说明卡片 */
.login-page__art-copy {
  position: absolute;
  left: -16px;
  top: -16px;
  z-index: 2;
  width: 80%;
  padding: 24px;
}

/* 大白话：插画区标题和说明文字 */
.login-page__art-title {
  margin: 0 0 8px;
  font-family: 'Epilogue', sans-serif;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
}

.login-page__art-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 24px;
}

/* 大白话：右边表单区是登录真正操作的地方 */
.login-page__panel {
  position: relative;
  z-index: 2;
  min-height: 620px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 32px;
  background-color: var(--color-surface);
}

/* 大白话：右边表单区不要那层黑点底纹，所以单独把 after 关掉 */
.login-page__panel--clean::after {
  display: none;
}

/* 大白话：表单头部这一块主要放品牌和返回首页 */
.login-page__header {
  margin-bottom: 40px;
  text-align: center;
  animation: fade-in-up 0.6s ease-out forwards;
}

.login-page__back-home {
  display: inline-block;
  margin-bottom: 20px;
  color: var(--color-text-soft);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-decoration: none;
  text-transform: uppercase;
}

.login-page__brand {
  margin: 0 0 8px;
  font-family: 'Epilogue', sans-serif;
  font-size: 48px;
  line-height: 56px;
  letter-spacing: -0.02em;
  font-weight: 800;
}

.login-page__sub-brand {
  margin: 0;
  color: var(--color-text-soft);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* 大白话：下面这一块是登录表单本体 */
.login-form {
  animation: fade-in-up 0.6s ease-out 0.2s forwards;
  opacity: 0;
}

/* 大白话：每个输入项都单独分组，后面你改哪一项比较好找 */
.login-form__group + .login-form__group {
  margin-top: 24px;
}

.login-form__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.login-form__label {
  color: var(--color-text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.login-form__helper {
  color: var(--color-text-soft);
  font-size: 12px;
  line-height: 16px;
}

.login-form__item {
  margin-bottom: 0;
}

/* 大白话：输入框视觉上改成原型图那种只有下边框的样子 */
:deep(.login-form__item .el-form-item__content) {
  display: block;
}

:deep(.login-form__input .el-input__wrapper) {
  padding: 0 6px;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  border: 2px solid var(--color-border);
  transition: all 0.3s ease;
  border-radius: 12px;
}

:deep(.login-form__input .el-input__wrapper.is-focus) {
  background-color: var(--color-surface-low);
  box-shadow: none;
}

:deep(.login-form__input .el-input__inner) {
  height: 48px;
  color: var(--color-text);
  font-size: 16px;
  line-height: 24px;
}

:deep(.login-form__input .el-input__inner::placeholder) {
  color: rgba(76, 69, 70, 0.5);
}

:deep(.login-form__input .el-input__suffix-inner) {
  color: var(--color-text-muted);
}

:deep(.login-form__item .el-form-item__error) {
  position: static;
  margin-top: 8px;
}

/* 大白话：按钮这一块单独拎出来，后面要改尺寸和动画就看这里 */
.login-form__action {
  padding-top: 24px;
  animation: fade-in-up 0.6s ease-out 0.3s forwards;
  opacity: 0;
}

:deep(.login-form__button) {
  width: 100%;
  height: 64px;
  border: 2px solid var(--color-border);
  border-radius: 0;
  background-color: var(--color-border);
  color: #ffffff;
  font-family: 'Epilogue', sans-serif;
  font-size: 28px;
  line-height: 34px;
  font-weight: 700;
  transition: all 0.2s ease;
  border-radius: 12px;
}

:deep(.login-form__button:hover) {
  background-color: transparent;
  color: var(--color-text);
}

.login-form__button-icon {
  font-size: 22px;
}

/* 大白话：底部注册链接放在这里，风格也按原稿做成强调样式 */
.login-page__footer {
  margin-top: 32px;
  text-align: center;
  animation: fade-in-up 0.6s ease-out 0.3s forwards;
  opacity: 0;
}

.login-page__footer-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 24px;
}

.login-page__footer-link {
  display: inline-block;
  margin-left: 8px;
  padding: 0 4px;
  border-bottom: 2px solid var(--color-border);
  color: var(--color-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: all 0.2s ease;
}

.login-page__footer-link:hover {
  background-color: var(--color-border);
  color: #ffffff;
}

/* 大白话：这就是整页卡片外框的统一样式 */
.manga-panel {
  position: relative;
  background-color: var(--color-surface);
  border-radius: 12px;

}

.manga-panel::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: -6px;
  bottom: -6px;
  z-index: -1;
  background-image: radial-gradient(rgba(76, 69, 70, 0.45) 1px, transparent 1px);
  background-size: 4px 4px;
}

/* 大白话：下面这个动画负责让表单内容进场时从下往上淡入 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 大白话：桌面端切成双栏，同时把左右间距拉开，跟原型图更像 */
@media (min-width: 768px) {
  .login-page {
    padding: var(--space-desktop);
  }

  .login-page__main {
    grid-template-columns: 1fr 1fr;
  }

  .login-page__art {
    display: block;
  }

  .login-page__panel {
    padding: 64px 56px;
  }

  .login-page__header {
    text-align: left;
  }
}

@media (max-width: 767px) {
  .login-page__flower {
    width: 120px;
    height: 300px;
    opacity: 0.12;
  }

  .login-page__flower--left {
    left: -18px;
  }

  .login-page__flower--right {
    right: -18px;
  }
}

:deep(.login-form__input input:-webkit-autofill),
:deep(.login-form__input input:-webkit-autofill:hover),
:deep(.login-form__input input:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--color-text);
  -webkit-box-shadow: 0 0 0 1000px transparent inset;
  transition: background-color 9999s ease-in-out 0s;
}
</style>
