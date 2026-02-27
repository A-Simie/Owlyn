import type { AxiosError } from 'axios'

export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly raw: unknown

    constructor(status: number, code: string, message: string, raw?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
        this.raw = raw
    }

    get isUnauthorized(): boolean {
        return this.status === 401
    }

    get isForbidden(): boolean {
        return this.status === 403
    }

    get isConflict(): boolean {
        return this.status === 409
    }

    get isNetworkError(): boolean {
        return this.status === 0
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
}

export function extractApiError(error: unknown): ApiError {
    if (isApiError(error)) return error

    const axiosErr = error as AxiosError<unknown>

    if (axiosErr?.isAxiosError) {
        const status = axiosErr.response?.status ?? 0
        const data = axiosErr.response?.data

        if (!axiosErr.response) {
            return new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection.', axiosErr)
        }

        if (typeof data === 'string') {
            return new ApiError(status, `HTTP_${status}`, data, axiosErr)
        }

        if (data && typeof data === 'object') {
            const body = data as Record<string, unknown>
            const message =
                (typeof body.error === 'string' && body.error) ||
                (typeof body.message === 'string' && body.message) ||
                `Request failed with status ${status}`
            const code = (typeof body.code === 'string' && body.code) || `HTTP_${status}`
            return new ApiError(status, code, message, body)
        }

        return new ApiError(status, `HTTP_${status}`, `Request failed with status ${status}`, axiosErr)
    }

    if (error instanceof Error) {
        return new ApiError(0, 'UNKNOWN', error.message, error)
    }

    return new ApiError(0, 'UNKNOWN', 'An unexpected error occurred', error)
}
