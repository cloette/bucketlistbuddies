/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'dim-grey':     '#7b7263',
        'lavender':     '#b388eb',
        'canary':       '#fcff4b',
        'indigo-brand': '#440381',
        'frost':        '#8edce6',
      },
    },
  },
  plugins: [],
}
