// 大白话：用 Cloudflare Workers AI 免费接口跑 AI 聊天，不用任何第三方 key。
export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '只接受 POST' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { messages } = await request.json()

    // 大白话：用 Llama 3 免费模型跑心理对话，每次最多回复 400 字。
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 400,
      temperature: 0.8
    })

    return new Response(JSON.stringify({ content: result.response }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
