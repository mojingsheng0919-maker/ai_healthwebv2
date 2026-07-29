const API_ORIGIN = 'http://159.75.169.224:1235'

export default async function(request, context) {
  const url = new URL(request.url)
  const path = url.pathname + url.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-proto')

  const fetchOptions = {
    method: request.method,
    headers,
    redirect: 'manual'
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = await request.arrayBuffer()
  }

  try {
    const response = await fetch(API_ORIGIN + path, fetchOptions)
    return response
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: err.message }), {
      status: 502,
      headers: { 'content-type': 'application/json' }
    })
  }
}
