/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#09090b',
        s1: '#111113',
        s2: '#18181b',
        s3: '#27272a',
        b1: '#27272a',
        b2: '#3f3f46',
        t1: '#fafafa',
        t2: '#a1a1aa',
        t3: '#71717a',
        accent: '#4646ff',
        'accent-hover': '#2563eb',
        green: '#22c55e',
        red: '#ef4444',
        yellow: '#f59e0b',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .4s cubic-bezier(.22,1,.36,1) both',
        fadeIn: 'fadeIn .3s ease both',
        shimmer: 'shimmer 2s infinite linear',
        pulse: 'pulse 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
