<template>
  <div class="frontend-layout">
    <!-- 大白话：前台页面共用的顶部导航，首页和咨询页都会走这里 -->
    <nav class="home-nav">
      <div class="home-nav__inner">
        <router-link class="home-nav__brand" to="/">Kokoro AI</router-link>

        <div class="home-nav__links">
          <router-link class="home-nav__link" exact-active-class="home-nav__link--active" to="/">
            Home
          </router-link>
          <a class="home-nav__link" :class="{ 'home-nav__link--active': $route.path === '/consultation' }" @click.prevent="goConsultation" >
            <a href="#">Consultation</a>
          </a>
        </div>

        <div class="home-nav__actions">
          <router-link class="home-nav__login halftone-hover" to="/login" v-if = '!token'>
            Login
          </router-link>
          <router-link class="home-nav__login halftone-hover" to="/register" v-if = '!token'>
            Register
          </router-link>
          <!-- 大白话：点头像会在正下方弹出退出登录，再点一次收起 -->
          <div class="home-nav__user-menu" v-if="token" ref="userMenuRef">
            <button class="home-nav__icon-btn" type="button" @click="handleClick">
              <span class="material-symbols-outlined home-nav__icon" style="font-variation-settings: 'FILL' 1;">
                account_circle
              </span>
            </button>
            <button v-if="showUserMenu" class="home-nav__logout" type="button" @click="handleLogout">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 大白话：这里放具体页面内容，比如 Home 或 Consultation -->
    <main class="frontend-layout__content">
      <router-view></router-view>
    </main>

    <!-- 大白话：前台页面共用的底部页脚 -->
    <footer class="home-footer">
      <div class="home-footer__inner">
        <div class="home-footer__brand">
          <router-link to="/">KOKORO AI</router-link>
        </div>
        <div class="home-footer__copyright">
          © 2026 All rights reserved By Mojingsheng @ <a href="https://github.com/mojingsheng0919-maker">github</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const showUserMenu = ref(false)
const userMenuRef = ref(null)

const token = ref(localStorage.getItem('token'))

// 大白话：跳咨询页之前先检查有没有登录，没登录就先去登录页
const goConsultation = () => {
  if (!token.value) {
    router.push('/login')
  } else {
    router.push('/consultation')
  }
}

// 大白话：点头像时切换退出登录的显示/隐藏
const handleClick = () => {
  showUserMenu.value = !showUserMenu.value
}

// 大白话：点了页面其他地方就把菜单关掉
const handleClickOutside = (e) => {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false
  }
}

// 大白话：菜单打开时给页面挂一个点击监听，关了就去掉
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = () => {
  // 大白话：退出登录就是把本地 token 和用户信息清掉，再跳回首页。
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  token.value = ''
  showUserMenu.value = false
  router.push('/')
}
</script>


<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Epilogue:wght@700;800&family=JetBrains+Mono:wght@500&family=Manrope:wght@400;500&display=swap");

.frontend-layout {
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #000000;
  --color-text-soft: #5e5e5e;
  --space-mobile: 16px;
  --space-gutter: 24px;
  --space-panel: 32px;
  --space-desktop: 64px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.frontend-layout__content {
  flex: 1;
}

.home-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: var(--color-bg);
  border-bottom: 2px solid var(--color-text);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-gutter);
    padding: 16px var(--space-mobile);
  }

  &__brand {
    color: var(--color-text);
    font-family: 'Epilogue', sans-serif;
    font-size: 48px;
    line-height: 56px;
    letter-spacing: -0.02em;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  &__links {
    display: none;
    align-items: center;
    gap: var(--space-gutter);
    font-family: 'Manrope', sans-serif;
    font-size: 16px;
    line-height: 24px;
  }

  &__link {
    color: var(--color-text-soft);
    padding: 0 8px 4px;
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      border-bottom: 1.5px solid;
      transform: translateY(-5px);
      box-shadow: 0 4px 10px rgba(250, 250, 250, 0.01);
    }

    &--active {
      color: var(--color-text);
      font-weight: 700;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__user-menu {
    position: relative;
  }

  &__login {
    display: none;
    border: 2px solid var(--color-text);
    border-radius: 16px;
    padding: 4px 16px;
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.05em;
    font-weight: 500;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover {
      background-color: var(--color-text);
      color: var(--color-surface);
    }
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #e2e2e2;
    }
  }

  &__icon {
    font-size: 24px;
  }

  &__logout {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 116px;
    padding: 8px 12px;
    border: 2px solid var(--color-text);
    border-radius: 12px;
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--color-text);
      color: var(--color-surface);
    }
  }
}

.home-footer {
  margin-top: var(--space-panel);
  background-color: var(--color-bg);
  border-top: 2px solid var(--color-text);

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 32px var(--space-desktop);
  }

  &__brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.05em;
    font-weight: 500;
    text-transform: uppercase;

    a {
      color: var(--color-text);
      text-decoration: none;
    }
  }

  &__copyright {
    color: var(--color-text-soft);
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
  }
}

@media (min-width: 768px) {
  .home-nav {
    &__inner {
      padding-left: var(--space-desktop);
      padding-right: var(--space-desktop);
    }

    &__links,
    &__login {
      display: flex;
    }
  }

  .home-footer {
    &__inner {
      flex-direction: row;
    }
  }
}
</style>
