import { API_BASE_URL } from '../config'
import { getTimezoneHeaders } from '../utils/dateUtils'

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
  count?: number
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    console.log('ApiClient making request to:', url, 'with options:', options);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...getTimezoneHeaders(), // Include timezone in all requests
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log('Making fetch request with config:', config);
      const response = await fetch(url, config)
      console.log('Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.text()
        console.log('Response not ok, error data:', errorData);
        throw new ApiError(response.status, errorData || response.statusText)
      }

      const data = await response.json()
      console.log('Parsed JSON data:', data);
      
      // Handle both wrapped and direct API responses
      // If the response is already wrapped in ApiResponse format, return it
      // Otherwise, wrap the direct data in ApiResponse format
      if (data && typeof data === 'object' && 'data' in data) {
        return data
      } else {
        return { data }
      }
    } catch (error) {
      console.error('ApiClient request error:', error);
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new ApiError(0, 'Network error occurred', error)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint

    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Singleton instance
export const apiClient = new ApiClient()