/** @type {import('tailwindcss').Config} */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        foreground: token('foreground'),
        card: { DEFAULT: token('card'), foreground: token('foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        link: token('link'),
        gold: { DEFAULT: token('gold'), foreground: token('gold-foreground') },
        success: token('success'),
        danger: token('danger'),
        // Paleta institucional Paseo Aranjuez
        aranjuez: {
          primary: '#0D5C3A',
          50: '#ECF8F1',
          100: '#D0EEDD',
          500: '#1A8656',
          600: '#0F6E46',
          700: '#0D5C3A',
          800: '#0B4A30',
          900: '#083823',
          gold: '#B7862B',
          dark: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        tile: '18px',
        sheet: '28px',
      },
      boxShadow: {
        tile: '0 4px 24px rgba(0,0,0,0.06)',
        lift: '0 12px 36px rgba(0,0,0,0.10)',
      },
      keyframes: {
        'scan-line': { '0%': { top: '10%' }, '50%': { top: '86%' }, '100%': { top: '10%' } },
      },
      animation: {
        'scan-line': 'scan-line 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
