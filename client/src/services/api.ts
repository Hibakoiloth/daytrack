const BASE_URL = ''

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  const response = await fetch(`${BASE_URL}${path}`, options)
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errJson = await response.json()
      message = errJson.message || errJson.error || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  const json = await response.json()
  return json.data as T
}

export function get<T>(path: string): Promise<T> {
  return apiRequest<T>('GET', path)
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('POST', path, body)
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('PUT', path, body)
}

export function del(path: string): Promise<void> {
  return apiRequest<void>('DELETE', path)
}
