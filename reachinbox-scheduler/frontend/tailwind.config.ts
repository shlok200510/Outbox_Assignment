import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { brand: { DEFAULT: '#0A9F47', dark: '#088239', soft: '#E7F5EC' }, ink: '#111714', mute: '#7A857E',
      surface: '#F4F6F5', line: '#E6EAE7', amber: { soft: '#FDEBDD', ink: '#D4540F' } },
    fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'], logo: ['var(--font-logo)', 'monospace'] },
  } },
  plugins: [],
} satisfies Config;
