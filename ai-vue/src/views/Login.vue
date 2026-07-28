<template>
     <div class="container">
    <div class="title">
      <div class="back-home">
        <el-icon><Back /></el-icon>
        <span>返回首页</span>
      </div>
      <div class="title-text">
        <h2>登录您的账户</h2>
        <p>请输入您的登录信息</p>
      </div>
    </div>
    <div class="form-container">
      <el-form
        ref="ruleFormRef"
        :model="formData"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username"  size="large" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password"  size="large" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
          <el-button class="btn"  size="large" type="primary" @click="submitForm">登录</el-button>
    </el-form>
    <div class="footer">
        <p>还没有账号？<router-link to="/auth/register">去注册</router-link></p>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref , reactive } from 'vue'
import { useRouter } from 'vue-router' // 路由跳转用
import { login } from '@/api/admin' // login函数定义在admin.js里，不是utils/requset.js  

const router = useRouter() // 获取路由实例

const ruleFormRef = ref(null)

const formData = reactive({
  username: '',
  password: ''
})

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
})

// 登录
const submitForm = async () => {
  const formEl = ruleFormRef.value // 通过ref拿到真正的表单实例
  if (!formEl) return

  await formEl.validate((valid, fields) => {
    if (valid) {
      login(formData).then(data => {
        if (!data.token) return console.error('登录失败')
        // 登录成功，存token和用户信息
        localStorage.setItem('token', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
        //根据用户类跳转不同的页面
        if(data.userInfo.userType === 2){
          router.push('/back/dashboard')
        }else{
          router.push('/')
        }
      })
    } else {
      console.log(fields)
    }
  })
}
</script>



<style scoped lang="scss">
.container {
  width: 384px;
  .title {
    .back-home {
      margin-bottom: 60px;
    }
    .title-text {
      h2 {
        font-size: 36px;
        margin-bottom: 10px;
      }
      p {
        font-size: 18px;
        color: #6b7280;
      }
    }
  }
  .form-container {
    margin-top: 30px;
    .btn {
      margin-top: 40px;
      width: 100%;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
    }
  }
}
</style>
