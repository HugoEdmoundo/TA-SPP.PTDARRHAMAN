import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F5F0',
        elevated: '#FFFFFF',
        obsidian: '#1A1A1A',
        slate: {
          DEFAULT: '#6B6B6B',
          light: '#949494',
          dark: '#4A4A4A',
        },
        emerald: {
          primary: '#1A6B47',
          bright: '#22C55E',
          dark: '#135235',
          light: '#E8F5EE',
          glow: 'rgba(34, 197, 94, 0.25)',
        },
        telegram: {
          blue: '#2AABEE',
          dark: '#229ED9',
          light: '#E8F6FF',
          glow: 'rgba(42, 171, 238, 0.25)',
        },
        gold: {
          accent: '#D4A853',
          light: '#F0C878',
          dark: '#B88F3D',
          bg: '#FEFAEE',
          glow: 'rgba(212, 168, 83, 0.25)',
        },
        rose: {
          danger: '#FF3B30',
          light: '#FFEEEE',
          dark: '#CC2F26',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', '"Outfit"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '"Outfit"', 'sans-serif'],
        mono: ['"Inter"', 'monospace'],
        numbers: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(26, 107, 71, 0.06)',
        'glass-hover': '0 12px 40px rgba(26, 107, 71, 0.12)',
        'glow-emerald': '0 0 20px rgba(34, 197, 94, 0.35)',
        'glow-gold': '0 0 20px rgba(212, 168, 83, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'slide-down': 'slide-down 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(110%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.94) translateY(8px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config;
