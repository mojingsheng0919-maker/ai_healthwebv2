<template>
  <div class="navbar"><!-- 导航栏 -->
    <!-- 导航栏左侧 -->
    <div class="flex-box">
      <p class="page-title">{{route.meta.title}}</p><!-- 导航栏左侧标题 -->
    </div>
    <!-- 导航栏右侧 -->
      <div class="flex-box">
        <!-- 导航栏右侧下拉菜单 -->
        <el-dropdown @command="handleCommand">
          <div class="flex-box"><!-- 导航栏右侧下拉菜单部分 -->
            <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <p class="user-name">admin</p><!-- 导航栏右侧下拉菜单用户名 -->
              <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown><!-- 导航栏右侧下拉菜单内容 -->
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
           </template>
        </el-dropdown>

      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'//导入ref函数，用于创建响应式数据
import { useRouter, useRoute } from 'vue-router'
      import { ElMessageBox } from 'element-plus'
import { logout } from '@/api/admin'

const router = useRouter()
const route = useRoute()

const handleCommand = (command) => {//处理下拉菜单命令
  if (command === 'logout') {
    // 处理退出登录逻辑
      ElMessageBox.confirm('确定退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 确认退出登录
    logout().then(() => {
      // 清除缓存
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 跳转到登录页
      router.push('/login')
    })
  }).catch(() => {
    // 用户点击取消，无需额外处理
  })
    }
}
</script>



<style lang="scss" scoped>

.navbar {/* 导航栏 */
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  border-bottom: 1px solid #e5e7eb;
  border-radius: 15px;
    .flex-box {/* 导航栏左侧 */
      display: flex;
      justify-content: center;
      align-items: center;
  }

    .page-title {/* 导航栏左侧标题 */
      margin-left: 10px;
      font-size: 20px;
      font-weight: bold;
      color: #1f2927;
  }
}
</style>
