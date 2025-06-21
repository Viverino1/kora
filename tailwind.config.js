/** @type {import('tailwindcss').Config} */
import withMT from '@material-tailwind/react/utils/withMT';

export default withMT({
  content: ['./src/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(252 252 252)',
        text: {
          DEFAULT: 'rgb(178 178 178)',
          light: 'rgb(252 252 252)'
        },
        background: 'rgb(0 0 0)',
        border: 'rgb(68 68 68)',
        card: 'rgb(68 68 68)'
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
        mono: ['Geist Mono', 'monospace']
      }
    }
  },
  variants: {
    extend: {},
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui']
    }
  },
  plugins: []
});
