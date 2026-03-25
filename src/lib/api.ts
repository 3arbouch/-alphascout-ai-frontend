import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  // Market data
  getTickers: () => request<{ count: number; tickers: string[] }>('/api/market/tickers'),
  getPrices: (ticker: string, start: string, end: string) =>
    request<{ ticker: string; count: number; data: any[] }>(`/api/market/prices/${ticker}?start=${start}&end=${end}`),
  getEarnings: (ticker: string) =>
    request<{ ticker: string; data: any[] }>(`/api/market/earnings/${ticker}`),
  getFundamentals: (ticker: string) =>
    request<{ ticker: string; income: any[]; balance: any[]; cashflow: any[] }>(`/api/market/fundamentals/${ticker}`),
  getProfile: (ticker: string) =>
    request<{ ticker: string; profile: any }>(`/api/market/profile/${ticker}`),

  // Strategies
  getStrategies: () => request<{ strategies: any[] }>('/api/strategies'),
  createStrategy: (config: any) =>
    request<any>('/api/strategies', { method: 'POST', body: JSON.stringify({ config }) }),
  deleteStrategy: (id: string) =>
    request<any>(`/api/strategies/${id}`, { method: 'DELETE' }),

  // Backtests
  runBacktest: (strategyId: string, params: { start_date: string; end_date: string; initial_capital: number }) =>
    request<any>('/api/backtests', { method: 'POST', body: JSON.stringify({ strategy_id: strategyId, ...params }) }),
  getBacktests: (strategyId?: string) =>
    request<{ backtests: any[] }>(`/api/backtests${strategyId ? `?strategy_id=${strategyId}` : ''}`),
  getBacktest: (id: string) => request<any>(`/api/backtests/${id}`),

  // Deployments
  getDeployments: () => request<{ deployments: any[] }>('/api/deployments'),

  // Chat — legacy (non-streaming)
  chat: (message: string) =>
    request<any>('/api/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Chat — sessions
  createSession: (title?: string, modelTier?: string) =>
    request<any>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, model_tier: modelTier || 'default' }),
    }),
  getSessions: () => request<{ sessions: any[] }>('/api/chat/sessions'),
  getSession: (id: string) => request<any>(`/api/chat/sessions/${id}`),
  deleteSession: (id: string) =>
    request<any>(`/api/chat/sessions/${id}`, { method: 'DELETE' }),

  // Chat — streaming
  chatStream: async function* (sessionId: string, message: string, modelTier?: string) {
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, model_tier: modelTier }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || res.statusText)
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            yield JSON.parse(line.slice(6))
          } catch {
            // skip malformed JSON
          }
        }
      }
    }
  },
}
