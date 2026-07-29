<template>
  <div class="kokoro-home">
    <!-- 大白话：这个 canvas 是漂浮墨点动画的画布，本身不放文字，只负责背景特效 -->
    <canvas id="ink-canvas"></canvas>

    <!-- 大白话：这里开始是首页主体内容。导航和页脚已经挪到 frontendLayout 里统一管理了 -->
    <main class="home-content">
      <!-- 大白话：第一屏 Hero 区，左边是文案和按钮，右边是插画 -->
      <section class="hero-section manga-panel">
        <!-- 大白话：这个点阵背景层只是为了做漫画纸纹理效果，不是实际内容 -->
        <div class="hero-section__halftone halftone-bg"></div>

        <div class="hero-section__panel">
          <!-- 大白话：Hero 左半边，主要放标题、副标题和主按钮 -->
          <div class="hero-section__text">
            <div class="hero-section__texture"></div>

            <h1 class="hero-section__title animate-fade-slide-up">
              Find your<br />quiet place.
            </h1>

            <p class="hero-section__desc animate-fade-slide-up" style="animation-delay: 0.2s;">
              A mindful AI companion designed with the warmth of a handwritten journal. Begin your healing journey today.
            </p>

            <!-- 大白话：Hero 里的主行动按钮，没登录先去登录页 -->
            <a class="hero-section__action animate-fade-slide-up" style="animation-delay: 0.4s;" @click.prevent="goConsultation">
              <button class="hero-section__button btn-ink-pop btn-pulse btn-sparkle">
                Start Journey
                <span class="material-symbols-outlined hero-section__button-icon">
                    arrow_forward
                </span>
              </button>
            </a>
          </div>

          <!-- 大白话：Hero 右半边是展示图，目前用的是背景图写法 -->
          <div class="hero-section__image-wrap">
            <div
              class="hero-section__image animate-float"
              data-alt="A striking black and white digital manga illustration of a peaceful scene featuring a cat resting comfortably on a sunlit windowsill. Outside the window, a calming, minimalist landscape of rolling hills and a single distant tree is depicted with hand-drawn line precision and delicate halftone screentone patterns. The lighting is bright and serene, emphasizing a light-mode, healing (Iyashikei) aesthetic typical of high-quality slice-of-life manga. The mood is tranquil, introspective, and comforting."
              :style="{ backgroundImage: `url(${catImage})` }"
            ></div>
          </div>
        </div>
      </section>

      <!-- 大白话：这里是下面三张功能卡片，介绍产品卖点 -->
      <section class="feature-section">
        <!-- 大白话：第一张卡片，强调 AI 陪伴 -->
        <div class="feature-card manga-panel halftone-hover manga-card-hover">
          <div class="feature-card__icon-wrap">
            <span class="material-symbols-outlined feature-card__icon">forum</span>
          </div>
          <h3 class="feature-card__title">AI Companion</h3>
          <p class="feature-card__desc">
            A gentle intelligence that listens without judgment. Designed to reflect your thoughts and guide you through moments of anxiety.
          </p>
        </div>

        <!-- 大白话：第二张卡片，强调隐私和安全 -->
        <div class="feature-card feature-card--highlight manga-panel halftone-hover manga-card-hover">
          <div class="feature-card__icon-wrap feature-card__icon-wrap--highlight">
            <span class="material-symbols-outlined feature-card__icon feature-card__icon--highlight">sanitizer</span>
          </div>
          <h3 class="feature-card__title">Safe Space</h3>
          <p class="feature-card__desc">
            Your data is entirely private, inked only in your personal journal. A secure environment meant just for you.
          </p>
        </div>

        <!-- 大白话：第三张卡片，强调全天候支持 -->
        <div class="feature-card manga-panel halftone-hover manga-card-hover">
          <div class="feature-card__icon-wrap">
            <span class="material-symbols-outlined feature-card__icon">schedule</span>
          </div>
          <h3 class="feature-card__title">24/7 Support</h3>
          <p class="feature-card__desc">
            Whether it's the middle of the night or a busy afternoon, your companion is always awake and ready to turn the page.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const catImage = new URL('@/assets/images/cat.png', import.meta.url).href

// 大白话：跳咨询页之前先检查有没有登录，没登录就先去登录页
const goConsultation = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
  } else {
    router.push('/consultation')
  }
}

// 大白话：这几个变量是给 canvas 粒子动画用的
let canvas = null
let ctx = null
let particlesArray = []
let animationId = 0

// 大白话：这个函数专门让画布宽高跟着浏览器窗口大小走
function initCanvas() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// 大白话：每一个 Particle 都代表一颗漂浮的小墨点
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 2 + 0.5
    this.speedX = Math.random() * 0.5 - 0.25
    this.speedY = Math.random() * -1 - 0.5
    this.opacity = Math.random() * 0.5
    this.color = Math.random() > 0.5 ? '0, 0, 0' : '100, 100, 100'
  }

  // 大白话：这里负责更新每颗墨点下一帧的位置
  update() {
    this.x += this.speedX
    this.y += this.speedY

    if (this.y < 0 - this.size) {
      this.y = canvas.height + this.size
      this.x = Math.random() * canvas.width
    }
  }

  // 大白话：这里负责把这颗墨点真正画到 canvas 上
  draw() {
    ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 大白话：这个函数是先批量创建一堆墨点，后面动画循环再反复驱动它们
function initParticles() {
  particlesArray = []
  const numberOfParticles = (canvas.width * canvas.height) / 30000

  for (let i = 0; i < numberOfParticles; i += 1) {
    particlesArray.push(new Particle())
  }
}

// 大白话：这是动画主循环，每一帧都先清空画布，再重画所有粒子
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < particlesArray.length; i += 1) {
    particlesArray[i].update()
    particlesArray[i].draw()
  }

  animationId = requestAnimationFrame(animate)
}

// 大白话：窗口尺寸变化时，画布和粒子数量都要重新算一遍
function handleResize() {
  initCanvas()
  initParticles()
}

// 大白话：组件一进页面就启动动画，并顺手把网页标题改掉
onMounted(() => {
  document.title = 'Kokoro AI - Your Healing Companion'
  canvas = document.getElementById('ink-canvas')

  if (!canvas) return

  ctx = canvas.getContext('2d')
  initCanvas()
  initParticles()
  animate()
  window.addEventListener('resize', handleResize)
})

// 大白话：组件离开页面时要把事件和动画停掉，免得内存一直占着
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped lang="scss">
/* 大白话：先把这个页面要用到的字体和图标字体引进来 */
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Epilogue:wght@700;800&family=JetBrains+Mono:wght@500&family=Manrope:wght@400;500&display=swap");

/* 大白话：这是整个首页自己的基础底色和排版环境 */
.kokoro-home {
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-surface-low: #f3f3f4;
  --color-text: #000000;
  --color-text-soft: #5e5e5e;
  --color-text-muted: #4c4546;
  --space-mobile: 16px;
  --space-gutter: 24px;
  --space-panel: 32px;
  --space-desktop: 64px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: 'Manrope', sans-serif;
}

/* 大白话：主体内容都收在 content 这一块，改首屏和卡片都来这里找 */
.home-content {
  flex: 1;
  width: 100%;
  padding: var(--space-panel) var(--space-mobile);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-panel);

}

.hero-section {
  position: relative;
  width: 100%;
  max-width: 80rem;

  &__halftone {
    position: absolute;
    inset: 1rem;
    z-index: -10;
    transform: translate(1rem, 1rem);
    transition: transform 0.5s ease;
  }

  &:hover &__halftone {
    transform: translate(1.5rem, 1.5rem);
  }

  &__panel {
    display: flex;
    flex-direction: column;
    min-height: 614px;
    background-color: var(--color-bg);
  }

  &__text {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-gutter);
    padding: var(--space-gutter);
    overflow: hidden;
    background-color: var(--color-bg);
    border-bottom: 2px solid var(--color-text);
    border-radius: 16px 0 0 16px;
  }

  &__texture {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    pointer-events: none;
    background: repeating-linear-gradient(45deg, transparent, transparent 10px, #000000 10px, #000000 12px);
  }

  &__title {
    position: relative;
    z-index: 1;
    color: var(--color-text);
    font-family: 'Epilogue', sans-serif;
    font-size: 48px;
    line-height: 56px;
    letter-spacing: -0.02em;
    font-weight: 800;
  }

  &__desc {
    position: relative;
    z-index: 1;
    max-width: 28rem;
    color: var(--color-text-muted);
    font-size: 18px;
    line-height: 28px;
  }

  &__action {
    position: relative;
    z-index: 1;
    margin-top: 1rem;
  }

  &__button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 16px 32px;
    border: 2px solid var(--color-text);
    background-color: var(--color-text);
    color: var(--color-surface);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.05em;
    font-weight: 500;
    text-transform: uppercase;
    cursor: pointer;
  }

  &__button-icon {
    font-size: 18px;
  }

  &__image-wrap {
    position: relative;
    flex: 1;
    min-height: 300px;
    overflow: hidden;
    background-color: var(--color-surface-low);
    border-radius: 16px;
  }

  &__image {
    position: absolute;
    inset: -10%;
    width: 120%;
    height: 120%;
    background-size: cover;
    background-position: center;
    transition: transform 2s ease-out;
  }

  &:hover &__image {
    transform: scale(1.05);
  }
}

.feature-section {
  width: 100%;
  max-width: 80rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
  padding-top: var(--space-desktop);
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-gutter);
  background-color: var(--color-bg);

  &--highlight {
    position: relative;
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
    border: 2px solid var(--color-text);
    border-radius: 999px;
    background-color: var(--color-surface);

    &--highlight {
      background-color: var(--color-text);
    }
  }

  &__icon {
    color: var(--color-text);
    font-size: 24px;

    &--highlight {
      color: var(--color-surface);
    }
  }

  &__title {
    color: var(--color-text);
    font-family: 'Epilogue', sans-serif;
    font-size: 28px;
    line-height: 34px;
    font-weight: 700;
  }

  &__desc {
    color: var(--color-text-soft);
    font-size: 16px;
    line-height: 24px;
  }
}

/* 大白话：下面这一大段是页面特效样式，比如点阵背景、卡片边框、按钮动画、漂浮动画 */
/* 大白话：点阵背景，主要用来做漫画纸颗粒感 */
.halftone-bg {
  background-image: radial-gradient(#000000 1px, transparent 1px);
  background-size: 8px 8px;
  opacity: 0.1;
}

.halftone-hover:hover {
  position: relative;
}

.halftone-hover:hover::before {
  content: '';
  position: absolute;
  inset: 4px -4px -4px 4px;
  background-image: radial-gradient(transparent 1px);
  background-size: 4px 4px;
  z-index: -1;
}

/* 大白话：按钮悬停时会轻轻弹出去一点点 */
.btn-ink-pop {
  transition: all 0.2s ease;
}

.btn-ink-pop:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 0 #000000;
}

/* 大白话：这个类是整个页面卡片外框的核心样式 */
.manga-panel {
  border: 2px solid #000000;
  border-radius: 2px 255px 3px 225px / 255px 5px 225px 3px;
  background-color: #f9f9f9;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
}

/* 大白话：这是墨点动画画布，让它固定铺满整个页面 */
#ink-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

/* 大白话：统一一下谷歌图标的默认粗细和填充方式 */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* 大白话：插画上下轻轻漂浮的动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* 大白话：文字和按钮往上淡入的动画 */
@keyframes fadeSlideUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-fade-slide-up {
  animation: fadeSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

/* 大白话：卡片鼠标移上去时会往左上抬一点，显得更有层次 */
.manga-card-hover {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.manga-card-hover:hover {
  transform: translate(-6px, -6px);
  box-shadow: 12px 12px 0 0 #000000;
  z-index: 10;
}

/* 大白话：主按钮轻微呼吸感动画 */
@keyframes pulse-subtle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.btn-pulse {
  animation: pulse-subtle 2s infinite;
}

/* 大白话：按钮表面扫光效果 */
.btn-sparkle {
  position: relative;
  overflow: hidden;
}

.btn-sparkle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: skewX(-25deg);
  transition: all 0s;
}

.btn-sparkle:hover::before {
  left: 150%;
  transition: left 0.6s ease-in-out;
}

@media (min-width: 768px) {
  .home-content {
    padding-left: var(--space-desktop);
    padding-right: var(--space-desktop);
  }

  .hero-section {
    &__panel {
      flex-direction: row;
    }

    &__text {
      padding: var(--space-desktop);
      border-right: 2px solid var(--color-text);
      border-bottom: 0;
    }
  }

  .feature-section {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .feature-card--highlight {
    transform: translateY(-1rem);
  }
}
</style>
