/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#15803d',
                    light: '#16a34a',
                    dark: '#0d1a12'
                },
                cream: {
                    DEFAULT: '#f7f4ee',
                    dark: '#0a120c'
                }
            },
            fontFamily: {
                serif: ['Fraunces', 'Georgia', 'serif'],
                script: ['Kaushan Script', '"Segoe Script"', 'cursive']
            }
        }
    },
    plugins: []
}