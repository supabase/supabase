import { useState } from 'react'

type ThemeChoice = 'system' | 'light' | 'dark'

const CHOICES: { value: ThemeChoice; label: string; icon: string }[] = [
  {
    value: 'system',
    label: 'System theme',
    icon: 'M4 5h16v11H4zM8 20h8M12 16v4',
  },
  {
    value: 'light',
    label: 'Light theme',
    icon: 'M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  { value: 'dark', label: 'Dark theme', icon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z' },
]

function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem('theme')
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

// Mirrors the script in index.html, which also keeps following the system
// preference while "system" is selected.
function applyChoice(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', choice)
  } catch {
    // private browsing can block localStorage; the choice just won't persist
  }
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = choice === 'system' ? (isSystemDark ? 'dark' : 'light') : choice
  document.documentElement.setAttribute('data-theme', theme)
}

/** System / light / dark switch. Defaults to the system preference. */
export function ThemeSwitch() {
  const [choice, setChoice] = useState(readChoice)

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-md border border-line p-0.5">
      {CHOICES.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          title={label}
          onClick={() => {
            setChoice(value)
            applyChoice(value)
          }}
          className="rounded p-1 text-muted hover:text-foreground aria-checked:bg-hover aria-checked:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
            aria-hidden
          >
            <path d={icon} />
          </svg>
        </button>
      ))}
    </div>
  )
}
