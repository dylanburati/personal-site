/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: ["stroke-current"],
  theme: {
    borderColor: ({ theme }) => ({
      DEFAULT: theme('colors.paper.darker', 'currentColor'),
      ...theme('colors'),
    }),
    colors: ({ colors }) => ({
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      blue: colors.blue,
      paper: {
        DEFAULT: 'var(--color-paper)',
        darker: 'var(--color-paper-darker)',
        dark: 'var(--color-paper-dark)',
      },
      pen: {
        DEFAULT: 'var(--color-pen)',
        lighter: 'var(--color-pen-lighter)',
        light: 'var(--color-pen-light)',
      },
      accent: {
        DEFAULT: 'var(--color-accent)',
        700: 'var(--color-accent-700)',
        200: 'var(--color-accent-200)',
      },
      green: {
        DEFAULT: 'var(--color-green)',
        500: colors.green['500'],
        600: colors.green['600'],
        700: colors.green['700'],
      },
      red: {
        500: colors.red['500'],
      },
      danger: colors.red['700'],
      navy: {
        DEFAULT: '#01477b',
        dark: '#092747',
      },
    }),
    extend: {
      maxWidth: {
        '1/2': '50%',
        '3/4': '75%',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
};
