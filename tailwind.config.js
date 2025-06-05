/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f5f7ff',
					100: '#ebf0ff',
					200: '#d9e3ff',
					300: '#b8ccff',
					400: '#8eabff',
					500: '#6366f1', // Indigo-600 as primary
					600: '#4f46e5',
					700: '#4338ca',
					800: '#3730a3',
					900: '#312e81',
					950: '#1e1b4b'
				}
			}
		}
	},
	plugins: [require('@tailwindcss/forms')]
};
