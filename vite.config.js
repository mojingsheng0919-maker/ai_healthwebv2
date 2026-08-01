import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {resolve} from 'path'

// 大白话：本地开发时，Vite 里直接搭一个 /api/ai-chat 的路由，转发到 Cloudflare Workers AI。
function aiChatPlugin(env) {
  return {
    name: 'ai-chat-dev',
    configureServer(server) {
      server.middlewares.use('/api/ai-chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end(JSON.stringify({ error: '只接受 POST' }))
          return
        }
        const chunks = []
        req.on('data', c => chunks.push(c))
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString())
            const accountId = env.CF_ACCOUNT_ID
            const apiToken = env.CF_API_TOKEN
            if (!accountId || !apiToken) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ content: '本地开发：请设置 CF_ACCOUNT_ID 和 CF_API_TOKEN 环境变量。' }))
              return
            }
            const cfRes = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiToken}`
                },
                body: JSON.stringify({
                  messages: body.messages,
                  max_tokens: 400,
                  temperature: 0.8
                })
              }
            )
            const cfData = await cfRes.json()
            if (cfData.success === false) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ content: 'AI 出错：' + (cfData.errors?.[0]?.message || '未知错误') }))
              return
            }
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ content: cfData.result?.response || '未获取到回复。' }))
          } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ content: 'AI 请求失败：' + err.message }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), tailwindcss(), aiChatPlugin(env)],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://159.75.169.224:1235',
          changeOrigin: true
        }
      }
    }
  }
})
