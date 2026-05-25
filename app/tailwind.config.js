/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pyro: '#ff7e5a',
        hydro: '#3da9fc',
        electro: '#b478f2',
        anemo: '#5ac8a8',
        cryo: '#8ed1d6',
        geo: '#d4a056',
        dendro: '#7cc34a',
      },
    },
  },
  plugins: [],
}
