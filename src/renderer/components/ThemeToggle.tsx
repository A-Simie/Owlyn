import { useThemeStore } from '../stores/theme.store'

export default function ThemeToggle() {
    const { mode, toggle } = useThemeStore()

    return (
        <button
            onClick={toggle}
            className="flex items-center justify-center rounded p-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
            <span className="material-symbols-outlined text-xl">
                {mode === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    )
}
