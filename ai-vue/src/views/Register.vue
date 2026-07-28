<template>
    <div class="container">
        <div class="title">
            <div class="title-text">
                <h2>创建我的账户</h2>
                <p>请填写注册信息</p>
            </div>
    </div>
        <div class="form-container">
         <el-form ref="submitFormRef" label-position="top" :model="formData" :rules="rules">
      <el-form-item label="用户名或邮箱" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名" size="large" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" size="large" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="formData.nickname" placeholder="请输入昵称(可选)" size="large" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入手机号(可选)" size="large" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="formData.password" placeholder="请输入密码" type="password" size="large" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" placeholder="请再次确认密码" type="password" size="large" />
      </el-form-item>
            <el-form-item>
              <el-button class="btn" type="primary" size="large" @click="submitForm">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { register } from '@/api/frontend'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

//ref（存表单数据，你现在 formData 这种）
//作用：收集页面输入的数据可以包字符串、数字、布尔、对象，JS 操作需要 .value
      const formData = reactive({
       "username": '',
        "email": '',
        "nickname": '',
        "phone": '',
        "password": '',
        "confirmPassword": '',
        "gender": 0,//0:男 1:女
        "userType": 1,//1:普通用户
})

// reactive（表单验证规则）
//作用：拿到页面上真实标签比如拿到输入框，实现自动聚焦、获取元素宽高；直接操作页面标签只能包对象 / 数组
const rules = reactive({
  "username": [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  "email": [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  "password": [{ required: true, message: '请输入密码', trigger: 'blur' }],
  "confirmPassword": [{ required: true, message: '请再次确认密码', trigger: 'blur' }],
})


// 表单提交
const submitFormRef = ref(null)// 表单元素

const submitForm = () => {
  const formEL = submitFormRef.value
  if (!formEL) return

  formEL.validate(async (valid) => {
    if (!valid) return
    register(formData).then((data) => {
      if (!data) {
        console.log(data)
        ElMessage.success('注册成功')
        router.push('/auth/login')
        return
      }
      if (data.code === "BUSINESS_ERROR") {
        ElMessage.error(data.message)
      }
    })
  })
}
</script>

<style scoped lang="scss">
.container {
    width: 384px;
    .flex-box {
        display: flex;
        align-items: center;
    }
    .title {
        .title-text {
            text-align: center;
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
            padding: 30px;
            text-align: center;
        }
    }
}

</style>
