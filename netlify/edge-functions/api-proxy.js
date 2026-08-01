const API_ORIGIN = 'http://159.75.169.224:1235'

// 大白话：Cloudflare Workers AI 免费模型
const CF_AI_URL = (accountId) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`

export default async function(request, context) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // ===== 大白话：AI 聊天走 Cloudflare Workers AI 免费接口 =====
  if (pathname === '/api/ai-chat' && request.method === 'POST') {
    try {
      const { messages } = await request.json()
      const accountId = Deno.env.get('CF_ACCOUNT_ID')
      const apiToken = Deno.env.get('CF_API_TOKEN')

      if (!accountId || !apiToken) {
        return new Response(JSON.stringify({ content: 'AI 服务未配置，请设置 CF_ACCOUNT_ID 和 CF_API_TOKEN 环境变量。' }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        })
      }

      const cfRes = await fetch(CF_AI_URL(accountId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          messages,
          max_tokens: 400,
          temperature: 0.8
        })
      })

      const cfData = await cfRes.json()

      if (cfData.success === false) {
        return new Response(JSON.stringify({
          content: 'AI 出错：' + (cfData.errors?.[0]?.message || '未知错误')
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({
        content: cfData.result?.response || '未获取到回复。'
      }), { headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
      return new Response(JSON.stringify({ content: 'AI 请求失败：' + err.message }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // ===== 大白话：其余 API 全部转发到后端服务器 =====
  const path = pathname + url.search
  const reqHeaders = new Headers(request.headers)
  reqHeaders.delete('host')
  reqHeaders.delete('x-forwarded-host')
  reqHeaders.delete('x-forwarded-proto')

  const fetchOptions = {
    method: request.method,
    headers: reqHeaders
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = await request.arrayBuffer()
  }

  try {
    const backendRes = await fetch(API_ORIGIN + path, fetchOptions)
    const ct = backendRes.headers.get('content-type') || ''
    const isStream = ct.includes('text/event-stream')

    if (!isStream || !backendRes.body) {
      const resHeaders = new Headers()
      for (const [key, value] of backendRes.headers) {
        const lower = key.toLowerCase()
        if (lower === 'transfer-encoding' || lower === 'connection' || lower === 'keep-alive') continue
        resHeaders.set(key, value)
      }
      const body = await backendRes.text()
      return new Response(body, { status: backendRes.status, headers: resHeaders })
    }

    const reader = backendRes.body.getReader()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) { controller.close(); return }
            controller.enqueue(value)
          }
        } catch (e) {
          controller.error(e)
        }
      },
      cancel() { reader.cancel() }
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'x-accel-buffering': 'no'
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: err.message }), {
      status: 502,
      headers: { 'content-type': 'application/json' }
    })
  }
}
