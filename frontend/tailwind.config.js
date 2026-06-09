/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jf: {
          verde: '#00E676',
          'verde-oscuro': '#00C853',
          'verde-claro': '#69F0AE',
          fondo: '#0A0A0A',
          'fondo-alt': '#111111',
          tarjeta: '#1A1A1A',
          'tarjeta-hover': '#242424',
          hover: '#2A2A2A',
          texto: '#E0E0E0',
          muted: '#9E9E9E',
          borde: '#2A2A2A',
          'borde-claro': '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'hero': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '800' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 230, 118, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 230, 118, 0.1)',
        'card': '0 4px 30px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
