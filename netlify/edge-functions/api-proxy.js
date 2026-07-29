const API_ORIGIN = 'http://159.75.169.224:1235'

export default async function(request, context) {
  const url = new URL(request.url)
  const path = url.pathname + url.search

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
      // 非流式：正常返回
      const resHeaders = new Headers()
      for (const [key, value] of backendRes.headers) {
        const lower = key.toLowerCase()
        if (lower === 'transfer-encoding' || lower === 'connection' || lower === 'keep-alive') continue
        resHeaders.set(key, value)
      }
      const body = await backendRes.text()
      return new Response(body, { status: backendRes.status, headers: resHeaders })
    }

    // 流式 SSE：手动逐块转发，避免 HTTP/1.1 chunked 和 HTTP/2 冲突
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