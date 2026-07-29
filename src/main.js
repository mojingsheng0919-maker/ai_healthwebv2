import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { defineStore, createPinia } from 'pinia'


const app = createApp(App)
const pinia = createPinia()

// 全局注册所有 Element Plus 图标，之后任意组件里直接用 <el-icon><Expand /></el-icon>，不用 import
for (const [key, component] of Object.entries(ElementPlusIcons)) {
  app.component(key, component)
}

app.use(ElementPlus).use(router).use(pinia).mount('#app')

