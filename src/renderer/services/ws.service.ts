import { WsIncomingMessageSchema } from '@shared/schemas/ws-messages.schema'
import type { WsOutgoingMessage, WsIncomingMessage } from '@shared/schemas/ws-messages.schema'

type MessageHandler = (msg: WsIncomingMessage) => void
type ConnectionHandler = () => void

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000

class WebSocketService {
    private ws: WebSocket | null = null
    private sessionId: string | null = null
    private reconnectAttempts = 0
    private handlers: MessageHandler[] = []
    private onConnectHandlers: ConnectionHandler[] = []
    private onDisconnectHandlers: ConnectionHandler[] = []

    connect(sessionId: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) return

        this.sessionId = sessionId
        this.reconnectAttempts = 0
        this.createConnection()
    }

    private createConnection(): void {
        if (!this.sessionId) return

        this.ws = new WebSocket(`${WS_URL}?sessionId=${this.sessionId}`)

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
                // invalid message, drop silently
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

    sendAudio(base64Data: string): void {
        this.send({ type: 'audio', data: base64Data, sampleRate: 16000 })
    }

    sendVideo(base64Data: string): void {
        this.send({ type: 'image', data: base64Data, mimeType: 'image/jpeg' })
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
        this.sessionId = null
        this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS
        this.ws?.close()
        this.ws = null
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

export const wsService = new WebSocketService()
