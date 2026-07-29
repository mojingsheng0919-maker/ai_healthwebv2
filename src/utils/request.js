import axios from 'axios' // 引入axios库，用来发HTTP请求
import { ElMessage } from 'element-plus' // 从Element Plus里引入消息提示组件，用来弹窗提示
import router from '@/router'


// 创建一个axios实例（可以理解为配置好的专属请求工具）
const service = axios.create({
  baseURL: '/api', // 所有请求自动在前面加上/api，比如请求/user会变成/api/user
  timeout: 5000, // 请求最多等5秒，超时就报错
})

// ==================== 请求拦截器：每次发请求前都会经过这里 ====================
service.interceptors.request.use(
  (config) => {
    // 从浏览器本地存储里取出登录时保存的token（相当于你的身份凭证）
    const token = localStorage.getItem('token')
    if (token) {
      // 如果token存在，就把它塞到请求头里，后端靠这个识别你是谁
      config.headers['token'] = token
    }
    return config // 把加工好的请求配置继续发出去
  },
  (error) => {
    // 请求发出去之前就报错了（比如网络断了），直接把错误抛出去
    return Promise.reject(error)
  }
)

// ==================== 响应拦截器：每次收到服务器返回的数据都会经过这里 ====================
service.interceptors.response.use(
  (response) => {
    // response是整个响应对象，里面有状态码、响应头、返回的数据等
    const { data , config } = response // 从response里解构出data（后端返回的主体数据）和config（请求配置，包含url等）
    if (data.code === "200") {
      console.log(data.data)
      return data.data // code=200表示请求成功，把真正的业务数据返回给调用者
    }else{
      if (data.code === "-1") {
        // code=-1表示登录过期了，需要判断当前是不是在登录页面
        if (!config.url?.includes("/login")) {
          // 当前不在登录页 → 弹出提示，清空登录信息，强制跳转到登录页
          ElMessage.error(data.msg || "登录过期，请重新登录")
          localStorage.removeItem('token') // 清除token
          localStorage.removeItem('userInfo') // 清除用户信息
          window.location.href = '/login' // 跳转到登录页
        }else{
          // 本来就在登录页，只弹提示就行，不用再跳转了
          ElMessage.error(data.msg || "登录过期，请重新登录")
          return Promise.reject('网络请求失败....') // 把错误抛出去让调用者处理
        }
      }
    }
    return response // 其他情况，原样返回响应
  },
  (error) => {
    // 网络层面的错误（比如服务器挂了、跨域等），直接抛出去
    return Promise.reject(error)
  }
)

export default service // 把配置好的axios实例导出，其他地方引入就能用
