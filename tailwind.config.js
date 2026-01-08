/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'selector',
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                accent: 'var(--color-accent)',
                neutralGrey: '#6c6c6c',
                gulfWhite: '#ffffff'
            }
        }
    },
    plugins: [],
}
