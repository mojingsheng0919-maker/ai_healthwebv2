const API_ORIGIN = 'http://159.75.169.224:1235'

export async function onRequest(context) {
  const { request } = context
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(API_ORIGIN)

  // 大白话：把用户访问的 /api/... 路径和查询参数原封不动拼到真实后端地址上�?  targetUrl.pathname = incomingUrl.pathname
  targetUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.set('x-forwarded-host', incomingUrl.host)
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''))

  // 大白话：GET/HEAD 这种请求本来就没有请求体，直接别�?body，免得转发时报错�?  const requestInit = {
    method: request.method,
    headers,
    redirect: 'manual'
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    requestInit.body = await request.arrayBuffer()
  }

  return fetch(targetUrl.toString(), requestInit)
}
