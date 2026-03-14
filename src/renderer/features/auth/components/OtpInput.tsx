import { useState, useRef, useCallback, useEffect } from 'react'

interface OtpInputProps {
    length?: number
    onComplete: (otp: string) => void
    disabled?: boolean
    error?: string | null
}

export default function OtpInput({ length = 6, onComplete, disabled = false, error }: OtpInputProps) {
    const [digits, setDigits] = useState<string[]>(Array(length).fill(''))
    const inputs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        inputs.current[0]?.focus()
    }, [])

    const handleChange = useCallback(
        (index: number, value: string) => {
            if (!/^\d*$/.test(value)) return

            const char = value.slice(-1)
            const next = [...digits]
            next[index] = char
            setDigits(next)

            if (char && index < length - 1) {
                inputs.current[index + 1]?.focus()
            }

            if (next.every((d) => d !== '')) {
                onComplete(next.join(''))
            }
        },
        [digits, length, onComplete],
    )

    const handleKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
                inputs.current[index - 1]?.focus()
            }
        },
        [digits],
    )

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
            if (!pasted) return

            const next = [...digits]
            for (let i = 0; i < pasted.length; i++) {
                next[i] = pasted[i]
            }
            setDigits(next)

            const focusIndex = Math.min(pasted.length, length - 1)
            inputs.current[focusIndex]?.focus()

            if (next.every((d) => d !== '')) {
                onComplete(next.join(''))
            }
        },
        [digits, length, onComplete],
    )

    return (
        <div>
            <div className="flex items-center justify-center gap-3">
                {digits.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => { inputs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={disabled}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        className={`w-12 h-14 text-center text-xl font-bold rounded bg-slate-50 dark:bg-background-dark border transition-all outline-none
                            ${error
                                ? 'border-red-500 text-red-400'
                                : 'border-slate-200 dark:border-slate-800 text-heading input-gold-focus'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    />
                ))}
            </div>
            {error && (
                <p className="text-red-400 text-xs text-center mt-3">{error}</p>
            )}
        </div>
    )
}
