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

    const resHeaders = new Headers()

    if (isStream) {
      resHeaders.set('content-type', 'text/event-stream')
      resHeaders.set('cache-control', 'no-cache')
      resHeaders.set('x-accel-buffering', 'no')
    } else {
      for (const [key, value] of backendRes.headers) {
        const lower = key.toLowerCase()
        if (lower === 'transfer-encoding' || lower === 'connection' || lower === 'keep-alive') continue
        resHeaders.set(key, value)
      }
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: err.message }), {
      status: 502,
      headers: { 'content-type': 'application/json' }
    })
  }
}