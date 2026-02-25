type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    timestamp: string
    level: LogLevel
    source: string
    message: string
    data?: unknown
}

const IS_DEV = process.env.NODE_ENV !== 'production'

function formatEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`
    return entry.data ? `${base} ${JSON.stringify(entry.data)}` : base
}

function createLogFn(source: string, level: LogLevel) {
    return (message: string, data?: unknown): void => {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            source,
            message,
            data,
        }
        if (IS_DEV) {
            const formatted = formatEntry(entry)
            switch (level) {
                case 'error': console.error(formatted); break
                case 'warn': console.warn(formatted); break
                default: console.log(formatted); break
            }
        }
    }
}

export function createLogger(source: string) {
    return {
        debug: createLogFn(source, 'debug'),
        info: createLogFn(source, 'info'),
        warn: createLogFn(source, 'warn'),
        error: createLogFn(source, 'error'),
    }
}
