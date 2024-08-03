/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [],
	safelist: [
		'grid-cols-1',
		'grid-cols-2',
		'grid-cols-3',
		'grid-cols-4',
		'grid-cols-5',
		'grid-cols-6',
		'grid-rows-1',
		'grid-rows-2',
		'grid-rows-3',
		'grid-rows-4',
		'grid-rows-5',
		'grid-rows-6',

		'col-start-1',
		'col-start-2',
		'col-start-3',
		'col-start-4',
		'col-start-5',
		'col-start-6',
		'col-span-1',
		'col-span-2',
		'col-span-3',
		'col-span-4',
		'col-span-5',
		'col-span-6',

		'row-start-1',
		'row-start-2',
		'row-start-3',
		'row-start-4',
		'row-start-5',
		'row-start-6',
		'row-span-1',
		'row-span-2',
		'row-span-3',
		'row-span-4',
		'row-span-5',
		'row-span-6'
	]
};
