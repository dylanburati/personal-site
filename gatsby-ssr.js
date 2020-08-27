import React from 'react';

const setThemeImmediately = `(function() {
  try {
    var initialTheme = localStorage.theme ? localStorage.theme : 'light';
    document.documentElement.dataset.theme = initialTheme;
  } catch(e) {
  }
})()`;

export const onRenderBody = ({ setPreBodyComponents }) => {
  const script = React.createElement('script', {
    key: 'set-theme-immediately',
    dangerouslySetInnerHTML: {
      __html: setThemeImmediately,
    },
  });
  setPreBodyComponents([script]);
};
