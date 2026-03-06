import { WsIncomingMessageSchema } from '@shared/schemas/ws-messages.schema'
import type { WsOutgoingMessage, WsIncomingMessage } from '@shared/schemas/ws-messages.schema'

type MessageHandler = (msg: WsIncomingMessage) => void
type ConnectionHandler = () => void

const WS_URL = import.meta.env.VITE_WS_URL
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000

class WebSocketService {
    private ws: WebSocket | null = null
    private token: string | null = null
    private reconnectAttempts = 0
    private handlers: MessageHandler[] = []
    private onConnectHandlers: ConnectionHandler[] = []
    private onDisconnectHandlers: ConnectionHandler[] = []

    connect(token: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) return

        this.token = token
        this.reconnectAttempts = 0
        this.createConnection()
    }

    private createConnection(): void {
        if (!this.token) return

        this.ws = new WebSocket(`${WS_URL}/stream?token=${this.token}`)

        this.ws.onopen = () => {
            this.reconnectAttempts = 0
            this.onConnectHandlers.forEach((h) => h())
        }

        this.ws.onmessage = (event) => {
            try {
                const raw = JSON.parse(event.data as string)
                const parsed = WsIncomingMessageSchema.safeParse(raw)
                if (parsed.success) {
                    this.handlers.forEach((h) => h(parsed.data))
                }
            } catch {
            }
        }

        this.ws.onclose = () => {
            this.onDisconnectHandlers.forEach((h) => h())
            this.attemptReconnect()
        }

        this.ws.onerror = () => {
            this.ws?.close()
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return
        this.reconnectAttempts++
        const delay = BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1)
        setTimeout(() => this.createConnection(), delay)
    }

    send(message: WsOutgoingMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        }
    }

    sendMedia(videoFrame: string, audioChunk?: string, codeEditorText?: string): void {
        this.send({ event: 'MEDIA', videoFrame, audioChunk, codeEditorText })
    }

    sendRunCode(): void {
        this.send({ event: 'RUN_CODE' })
    }

    onMessage(handler: MessageHandler): () => void {
        this.handlers.push(handler)
        return () => {
            this.handlers = this.handlers.filter((h) => h !== handler)
        }
    }

    onConnect(handler: ConnectionHandler): () => void {
        this.onConnectHandlers.push(handler)
        return () => {
            this.onConnectHandlers = this.onConnectHandlers.filter((h) => h !== handler)
        }
    }

    onDisconnect(handler: ConnectionHandler): () => void {
        this.onDisconnectHandlers.push(handler)
        return () => {
            this.onDisconnectHandlers = this.onDisconnectHandlers.filter((h) => h !== handler)
        }
    }

    disconnect(): void {
        this.token = null
        this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS
        this.ws?.close()
        this.ws = null
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

export const wsService = new WebSocketService()
