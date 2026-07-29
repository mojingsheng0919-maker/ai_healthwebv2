<template>
  <div class="register-page">
    <div class="register-panel">
      <div class="register-panel__art">
        <div class="register-panel__dot-mask"></div>
        <div class="register-panel__art-copy">
          <p class="register-panel__eyebrow">Kokoro AI</p>
          <h2 class="register-panel__art-title">Join the Story</h2>
          <p class="register-panel__art-desc">From this moment on,l will help you to heal your mind.</p>
        </div>
        <div class="register-panel__art-frame">
          <img :src="catImage" alt="治愈系小猫插图" class="register-panel__art-image" />
        </div>
        <p class="register-panel__art-caption">Join the story with this cat.</p>
      </div>
      <div class="register-panel__form-side">
        <div class="register-panel__header">
          <p class="register-panel__mobile-brand">KOKORO AI</p>
          <h1 class="register-panel__title">Register your account</h1>
          <p class="register-panel__subtitle">Please fill in the information below to register.</p>
        </div>
        <el-form ref="submitFormRef" class="register-form" label-position="top" :model="formData" :rules="rules">
          <el-form-item label="Username" prop="username">
            <el-input v-model="formData.username" placeholder="Username required" size="large" />
          </el-form-item>
          <el-form-item label="Email" prop="email">
            <el-input v-model="formData.email" placeholder="Email required" size="large" />
          </el-form-item>
          <div class="register-form__grid">
            <el-form-item label="Nickname" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="Nickname (optional)" size="large" />
            </el-form-item>
            <el-form-item label="Phone" prop="phone">
              <el-input v-model="formData.phone" placeholder="Phone (optional)" size="large" />
            </el-form-item>
          </div>
          <el-form-item label="Password" prop="password">
            <el-input v-model="formData.password" placeholder="Password required" type="password" size="large" show-password />
          </el-form-item>
          <el-form-item label="Confirm Password" prop="confirmPassword">
            <el-input v-model="formData.confirmPassword" placeholder="Confirm Password required" type="password" size="large" show-password />
          </el-form-item>
          <el-form-item class="register-form__action">
            <el-button class="register-form__button" type="primary" size="large" @click="submitForm">Register now</el-button>
          </el-form-item>
        </el-form>
        <p class="register-panel__footer">
          Already have an account?
          <router-link class="register-panel__footer-link" to="/login">Login</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { register } from '@/api/frontend'
import { useRouter } from 'vue-router'

const router = useRouter()
const catImage = new URL('@/assets/images/cat.png', import.meta.url).href

// 大白话：这里就是表单真正提交给后端的数据，输入框写什么，这里就跟着变什么。
const formData = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: '',
  gender: 0,
  userType: 1
})

// 大白话：这里单独拎一个确认密码校验，主要是为了防止两次密码输得不一样。
const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次确认密码'))
    return
  }
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

// 大白话：rules 就是表单的检查清单，哪个字段必填、格式对不对，都在这里管。
const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
})

const submitFormRef = ref(null)

// 大白话：点注册按钮时，先让表单自检，通过了再去调注册接口。
const submitForm = () => {
  const formEL = submitFormRef.value
  if (!formEL) return

  formEL.validate(async (valid) => {
    if (!valid) return
    try {
      const result = await register(formData)

      // 大白话：这里兼容两种返回格式，只有明确告诉我们是业务失败时，才拦下来不跳转。
      if (result?.code === 'BUSINESS_ERROR' || result?.data?.code === 'BUSINESS_ERROR') {
        ElMessage.error(result.message || result.data?.message || '注册失败')
        return
      }

      ElMessage.success('Registration successful')
      await router.push('/login')
    } catch (error) {
      ElMessage.error('注册请求失败，请稍后再试')
      console.error(error)
    }
  })
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background-color: #f5f5f5;
  background-image: radial-gradient(#cfcfcf 1px, transparent 1px);
  background-size: 8px 8px;
}

.register-panel {
  width: 100%;
  max-width: 1180px;
  display: grid;
  grid-template-columns: 1.02fr 0.98fr;
  border: 2px solid #111111;
  background: #ffffff;
  box-shadow: 8px 8px 0 #111111;
  overflow: hidden;
}

.register-panel__art {
  position: relative;
  padding: 40px 36px;
  border-right: 2px solid #111111;
  background: #fbfbfb;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.register-panel__dot-mask {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image: radial-gradient(#111111 1px, transparent 1px);
  background-size: 6px 6px;
}

.register-panel__art-copy,
.register-panel__art-frame,
.register-panel__art-caption {
  position: relative;
  z-index: 1;
}

.register-panel__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
}

.register-panel__art-title {
  margin: 0;
  font-size: 42px;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
}

.register-panel__art-desc {
  margin: 12px 0 0;
  font-size: 17px;
  line-height: 1.7;
  color: #5b5b5b;
  text-align: center;
}

.register-panel__art-frame {
  width: min(100%, 520px);
  padding: 16px;
  border: 2px solid #111111;
  background: #ffffff;
  box-shadow: -6px 6px 0 #111111;
  transform: rotate(-2deg);
}

.register-panel__art-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  filter: grayscale(1);
  animation: cat-sway 4.2s ease-in-out infinite;
  transform-origin: center bottom;
}

.register-panel__art-caption {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #3a3a3a;
  text-align: center;
}

.register-panel__form-side {
  padding: 56px 48px 40px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.register-panel__header {
  margin-bottom: 28px;
}

.register-panel__mobile-brand {
  display: none;
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.24em;
}

.register-panel__title {
  margin: 0 0 12px;
  font-size: 48px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.register-panel__subtitle {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #666666;
}

.register-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.register-form__action {
  margin-top: 8px;
  margin-bottom: 0;
}

.register-form__button {
  width: 100%;
  height: 52px;
  border: 2px solid #111111;
  border-radius: 0;
  background: #111111;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  box-shadow: 4px 4px 0 #111111;
  transition: all 0.2s ease;
}

.register-form__button:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #111111;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.16) 0 12px, transparent 12px 24px),
    #111111;
}

.register-panel__footer {
  margin: 24px 0 0;
  font-size: 14px;
  color: #666666;
  text-align: center;
}

.register-panel__footer-link {
  margin-left: 6px;
  color: #111111;
  font-weight: 700;
  text-decoration: underline;
}

/* 大白话：下面这块专门改 Element Plus 自带样式，不然它默认味道太重，跟漫画风不搭。 */
.register-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.register-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: #111111;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.register-form :deep(.el-input__wrapper) {
  border-bottom: 2px solid #111111;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  padding: 0 0 10px;
  transition: all 0.2s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  box-shadow: none;
}

.register-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: none;
  background: #f2f2f2;
}

.register-form :deep(.el-input__inner) {
  height: 28px;
  color: #111111;
  font-size: 16px;
}

.register-form :deep(.el-input__inner::placeholder) {
  color: #9a9a9a;
}

.register-form :deep(.el-input__suffix-inner) {
  color: #666666;
}

.register-form :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: none;
  border-bottom-color: #d63b3b;
}

/* 大白话：这里让小猫轻轻左右晃，幅度很小，看起来会更柔和一点。 */
@keyframes cat-sway {
  0% {
    transform: translateX(0) rotate(0deg);
  }

  25% {
    transform: translateX(-8px) rotate(-1.2deg);
  }

  50% {
    transform: translateX(0) rotate(0deg);
  }

  75% {
    transform: translateX(8px) rotate(1.2deg);
  }

  100% {
    transform: translateX(0) rotate(0deg);
  }
}

@media (max-width: 1024px) {
  .register-panel {
    grid-template-columns: 1fr;
  }

  .register-panel__art {
    border-right: none;
    border-bottom: 2px solid #111111;
    padding: 32px 24px;
  }

  .register-panel__art-title {
    font-size: 34px;
  }

  .register-panel__form-side {
    padding: 40px 28px 32px;
  }

  .register-panel__title {
    font-size: 40px;
  }
}

@media (max-width: 768px) {
  .register-page {
    padding: 20px 14px;
  }

  .register-panel {
    box-shadow: 5px 5px 0 #111111;
  }

  .register-panel__art {
    display: none;
  }

  .register-panel__mobile-brand {
    display: block;
  }

  .register-panel__form-side {
    padding: 32px 20px 24px;
  }

  .register-panel__title {
    font-size: 34px;
  }

  .register-form__grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
