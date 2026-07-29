import service from '@/utils/request'

export function login(data) {
  return service.post('/user/login', data)//登录的请求
}

export function categoryTree() {
  return service.get('/knowledge/category/tree')//查询分类树的请求
}

export function articleList(params) {
  return service.get('/knowledge/article/page', { params })//分页查询文章列表的请求
}

export function uploadFile(file, businessInfo) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessType', 'ARTICLE')
  formData.append('businessId', businessInfo.businessId)
  formData.append('businessField', 'cover')

  return service.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function submitArticle(data) {
  return service.post('/knowledge/article', data)
}

export function getArticleDetail(id) {
  return service.get(`/knowledge/article/${id}`)
}

export function updateArticle(id, data) {
  return service.put(`/knowledge/article/${id}`, data)
}

//发布文章改变状态
export function changeArticleStatus(id, data) {
  return service.put(`/knowledge/article/${id}/status`, data)
}

//删除文章
export function deleteArticle(id) {
  return service.delete(`/knowledge/article/${id}`)
}

export function getConsultationPage(params) {
  return service.get('/psychological-chat/sessions', { params })
}

// 查询会话详情
export function getSessionDetail(sessionId) {
  // 查询会话详情
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`) 
}

export function getEmotionalPage(params) {
  // 查询情绪日志分页列表
  return service.get('/emotion-diary/admin/page', { params })
}

export function deleteEmotional(id) {
  // 删除情绪日志
  return service.delete(`/emotion-diary/admin/${id}`)
}

export function getArticleOverview() {
  // 查询文章详情http://159.75.169.224:1235/api/data-analytics/overview
  return service.get(`/data-analytics/overview`)
}

// 退出登录
export function logout() {
  return service.post('/user/logout')
}