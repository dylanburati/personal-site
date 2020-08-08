const { colors } = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    borderColor: theme => ({
      default: theme('colors.paper.darker', 'currentColor'),
      ...theme('colors'),
    }),
    colors: {
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      blue: colors.blue,
      paper: {
        default: 'var(--color-paper)',
        darker: 'var(--color-paper-darker)',
        dark: 'var(--color-paper-dark)',
      },
      pen: {
        default: 'var(--color-pen)',
        lighter: 'var(--color-pen-lighter)',
        light: 'var(--color-pen-light)',
      },
      accent: {
        default: 'var(--color-accent)',
        700: 'var(--color-accent-700)',
        200: 'var(--color-accent-200)',
      },
      green: {
        default: 'var(--color-green)',
        500: colors.green['500'],
        600: colors.green['600'],
      },
      red: {
        500: colors.red['500'],
      },
      danger: colors.red['700'],
      navy: {
        default: '#01477b',
        dark: '#092747',
      },
    },
    extend: {
      maxWidth: {
        '1/2': '50%',
        '3/4': '75%',
      },
    },
  },
};
