import { createRouter, createWebHistory } from 'vue-router'     
import BackendLayout from '@/components/BackendLayout.vue'
import FrontendLayout from '@/components/frontendLayout.vue'

// 路由配置
const backendLayoutRoutes = [
    {
        path: '/back',
        redirect: '/back/dashboard',//默认跳转到dashboard
        component: BackendLayout,
        children: [
            {
                path: 'dashboard',
                component: () => import('@/views/Dashboard.vue'),
                meta: {
                    title: 'Dashboard'          
                }
            },
            {
                path: 'knowledge',
                component: () => import('@/views/Knowledge.vue'),
                meta: {
                    title: 'Knowledge'
                }
            },
            {
                path: 'consultations',
                component: () => import('@/views/Consultations.vue'),
                meta: {
                    title: 'Consultations'
                }
            },
            {
                path: 'emotional',
                component: () => import('@/views/Emotional.vue'),
                meta: {
                    title: 'Emotional'
                }
            },

        ]
    }
]

const authLayoutRoutes = [
    {
        path: '/login',
        component: () => import('@/views/Login.vue'),
        meta: {
            title: 'Login'
        }
    },
    {
        path: '/register',
        component: () => import('@/views/Register.vue'),
        meta: {
            title: 'Register'
        }
    }
    ,
    {
        path: '/Consultation',
        component: () => import('@/views/Consultation.vue'),
        meta: {
            title: 'Consultation'
        }
    }
]

const frontendLayoutRoutes = [
    {
        path: '/',
        component: FrontendLayout,
        children: [
            {
                path: '/',
                component: () => import('@/views/Home.vue')
            }
        ]
    }
]






const router = createRouter({
    history: createWebHistory(),
    routes: [...backendLayoutRoutes, ...authLayoutRoutes, ...frontendLayoutRoutes]
})

// 路由前置守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  // 当前用户是否登录
  if (token) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))
    // 如果是后台用户
    if (userInfo.userType == 2) {
      if (to.path.startsWith('/back')) {
        next()
      } else {
        next('/back/dashboard')
      }
    }else if(userInfo.userType == 1){
        //只能访问前端布局
        if (to.path.startsWith('/back') || to.path.startsWith('/login') || to.path.startsWith('/register')) {
          next('/')
        } else {
          next()
        }
    }
  } else {
    if (to.path.startsWith('/back')) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
