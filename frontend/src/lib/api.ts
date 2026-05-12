const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gf_token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { headers: this.getHeaders() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  async delete(path: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gf_token') : null
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    })
    if (!res.ok && res.status !== 204) throw await res.json()
  }
}

export const api = new ApiClient()
