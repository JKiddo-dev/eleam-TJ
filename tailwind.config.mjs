/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        alabaster: '#F9F8F6',
        linen: {
          50: '#F9F8F6',
          100: '#F2EFE9',
          200: '#E6E1D6',
          300: '#D5CEC0',
        },
        forest: {
          800: '#1D3128',
          900: '#15251E',
          950: '#0E1914',
        },
        navy: {
          800: '#1E293B',
          900: '#141E2B',
          950: '#0C131C',
        },
        taupe: {
          500: '#8C7A6B',
          600: '#736255',
          700: '#594B40',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
