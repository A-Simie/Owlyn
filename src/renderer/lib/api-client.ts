import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL

let authStoreClearFn: (() => void) | null = null
let authStoreGetTokenFn: (() => string | null) | null = null

export function registerAuthClear(clearFn: () => void): void {
    authStoreClearFn = clearFn
}

export function registerAuthGetToken(getTokenFn: () => string | null): void {
    authStoreGetTokenFn = getTokenFn
}

function createApiClient(): AxiosInstance {
    const client = axios.create({
        baseURL: BASE_URL,
        timeout: 15_000,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    })

    axiosRetry(client, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) =>
            axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response?.status !== undefined && error.response.status >= 500),
    })

    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = authStoreGetTokenFn?.()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        },
        (error) => Promise.reject(error),
    )

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                authStoreClearFn?.()
            }
            return Promise.reject(error)
        },
    )

    return client
}

export const apiClient = createApiClient()
