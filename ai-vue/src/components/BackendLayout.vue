<template>
  <!-- 整个后台页面最外层 -->
  <div class="backend-layout">
    <!-- Element Plus 的整体布局容器，左边放侧边栏，右边放主内容 -->
    <el-container class="main-container">
      <!-- 左侧菜单栏 -->
      <Sidebar />
      <!-- 右边这一大块：上面导航栏，下面页面内容 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header>
          <Navbar />
        </el-header>
        <!-- 主内容区域，里面显示当前路由对应的页面 -->
        <el-main class="main-content">
          <!-- 白色内容卡片，真正的页面内容都包在这里面 -->
          <div class="content-container">
            <!-- 路由出口：切换菜单时，这里会显示不同页面 -->
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<script setup>
import Navbar from '@/components/Navbar.vue' // 顶部导航组件
import Sidebar from '@/components/Sidebar.vue' // 左侧菜单组件

</script>
<style lang="scss" scoped>
.backend-layout {
  height: 100vh; // 整个后台区域撑满一整屏高度
  background-color: #f5f7fa; // 页面外层灰底
  .el-header {
    height: 71px !important; // 顶部导航固定高度
    padding: 0; // 去掉 el-header 自带内边距，避免导航栏留白
  }
  .main-container {
    height: 100%; // 让内部布局继承整屏高度
  }
  .main-content {
    padding: 20px; // 灰色区域和白色内容卡片之间留出 20px 空隙
    background-color: #f5f7fa; // 主内容区继续保持灰底
    overflow-y: auto; // 内容太长时在这里滚动
    box-sizing: border-box; // padding 算进盒子尺寸里，避免撑大
    .content-container {
      background-color: #fff; // 白色内容区域
      min-height: 100%; // 最少占满可视内容区，内容更多时继续往下撑开
      padding: 20px; // 让里面的文字和表格别贴边
      box-sizing: border-box; // padding 不会把盒子额外撑大
      border-radius: 15px; // 白色卡片四个角做圆角
    }
  }
}
</style> 
