import { decodeJwt } from 'jose'

interface TokenClaims {
    userId?: string
    role?: string
    exp?: number
    iat?: number
    [key: string]: unknown
}

export function decodeToken(token: string): TokenClaims | null {
    try {
        return decodeJwt(token) as TokenClaims
    } catch {
        return null
    }
}

export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
    const claims = decodeToken(token)
    if (!claims?.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return claims.exp - bufferSeconds <= now
}

export function getTokenExpiryMs(token: string): number | null {
    const claims = decodeToken(token)
    if (!claims?.exp) return null
    return claims.exp * 1000 - Date.now()
}
