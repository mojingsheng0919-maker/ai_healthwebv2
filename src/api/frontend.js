import service from '@/utils/request'

export function register(data) {
   // http://159.75.169.224:1235/api/user/add
    return service.post('/user/add', data)//注册的请求
}

export function StartSession(data) {
    // http://159.75.169.224:1235/api/psychological-chat/session/start
    return service.post('/psychological-chat/session/start', data)//开始会话的请求
}

export const getSessionList = (params) => {
  return service.get('/psychological-chat/sessions', { params })
}

export const deleteSession = (sessionId) => {
  return service.delete(`/psychological-chat/sessions/${sessionId}`)
}

export const getSessionDetail = (sessionId) => {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

export const getSessionEmotion = (sessionId) => {
  return service.get(`/psychological-chat/session/${sessionId}/emotion`)
}