import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 300000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('medstudy_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medstudy_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (password) => axios.post('/auth/login', { password }),
}

export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData),
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
}

export const summariesAPI = {
  generate: (data) => api.post('/summaries/generate', data),
  list: (params) => api.get('/summaries', { params }),
  get: (id) => api.get(`/summaries/${id}`),
  delete: (id) => api.delete(`/summaries/${id}`),
}

export const diagramsAPI = {
  generate: (data) => api.post('/diagrams/generate', data),
  list: () => api.get('/diagrams'),
  get: (id) => api.get(`/diagrams/${id}`),
  delete: (id) => api.delete(`/diagrams/${id}`),
}

export const diseasesAPI = {
  generate: (data) => api.post('/diseases/generate', data),
  list: (params) => api.get('/diseases', { params }),
  get: (id) => api.get(`/diseases/${id}`),
  delete: (id) => api.delete(`/diseases/${id}`),
}

export const quizzesAPI = {
  generate: (data) => api.post('/quizzes/generate', data),
  evaluateClinical: (data) => api.post('/quizzes/evaluate-clinical', data),
  evaluateDevelopment: (data) => api.post('/quizzes/evaluate-development', data),
  list: () => api.get('/quizzes'),
  delete: (id) => api.delete(`/quizzes/${id}`),
}

export const foldersAPI = {
  create: (data) => api.post('/folders', data),
  list: (params) => api.get('/folders', { params }),
  delete: (id) => api.delete(`/folders/${id}`),
}
