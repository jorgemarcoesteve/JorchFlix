/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jf: {
          verde: '#00E676',
          'verde-oscuro': '#00C853',
          fondo: '#0A0A0A',
          tarjeta: '#1A1A1A',
          hover: '#2A2A2A',
          texto: '#E0E0E0',
          muted: '#9E9E9E',
          borde: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
