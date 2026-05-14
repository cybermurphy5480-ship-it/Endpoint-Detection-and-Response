import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ---------- Logs ----------
export const fetchLogs = async (params = {}) => {
  const res = await api.get('/logs', { params })
  return res.data
}

// ---------- Endpoints ----------
export const fetchEndpoints = async () => {
  const res = await api.get('/endpoints')
  return res.data
}

export default api
