<template>
  <el-aside width="264px">
        <el-menu
        default-active="2"
        @open="handleOpen"
        @close="handleClose"
        class="sidebar-menu"
      >

      <div class="brand">
        <el-image style="width: 50px; height: 50px; margin-right: 10px;"  :src="iconUrl" alt="logo" class="logo" />
        <div class="info-card">  
          <h1 class="brand-name">AI Mental Health</h1>
          <p class="brand-desc">Admin Panel</p>
        </div>
      </div>

     <el-menu-item @click="selectMenu" v-for="item in router.options.routes[0].children.filter(i => i.meta)" :key="item.path" :index="item.path">
          <span>{{ item.meta.title }}</span>
        </el-menu-item>
      </el-menu>
  </el-aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const iconUrl = new URL('@/assets/images/机器人.png', import.meta.url).href

const selectMenu = (key) => {
  const currentRoute = router.options.routes[0]
 
  router.push(`${currentRoute.path}/${key.index}`)
}

const handleOpen = () => {

}
const handleClose = () => {

}
</script>
<style lang="scss" scoped>

.sidebar-menu {
  height: 100%;
    .brand {
  display: flex;
  align-items: center;
  padding: 10px;
  justify-content: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e4e7ed;
  height: 70px;
  border-radius: 15px;
  .info-card {
      .brand-name {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #303133;
      }
      .brand-desc {
        font-size: 14px;
        color: #909399;
      }
  }
}
}
</style>
