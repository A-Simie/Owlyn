import type { Config } from 'tailwindcss'

export default {
    content: ['./src/renderer/**/*.{ts,tsx,html}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#c59f59',
                'background-light': '#f8f7f6',
                'background-dark': '#0a0a0a',
                obsidian: '#121212',
                charcoal: '#1a1a1a',
                'gold-muted': '#35322c',
            },
            fontFamily: {
                display: ['Space Grotesk', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '0.125rem',
                lg: '0.25rem',
                xl: '0.5rem',
                full: '0.75rem',
            },
        },
    },
    plugins: [],
} satisfies Config
