const API_ORIGIN = 'http://159.75.169.224:1235'

exports.handler = async function(event) {
  const path = event.path.replace('/.netlify/functions/api-proxy', '')
  const targetUrl = API_ORIGIN + path + (event.queryStringParameters
    ? '?' + new URLSearchParams(event.queryStringParameters).toString()
    : '')

  const headers = { ...event.headers }
  delete headers.host
  delete headers['x-forwarded-host']
  delete headers['x-forwarded-proto']

  const fetchOptions = {
    method: event.httpMethod,
    headers
  }

  if (event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    fetchOptions.body = event.body
  }

  try {
    const response = await fetch(targetUrl, fetchOptions)
    const body = await response.text()

    return {
      statusCode: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
        'access-control-allow-origin': '*'
      },
      body
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Proxy error', message: err.message })
    }
  }
}
