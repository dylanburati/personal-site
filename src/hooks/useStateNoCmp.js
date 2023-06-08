import { useState, useReducer } from 'react';

/**
 * @template T
 * @param {T | (() => T)} init
 * @returns {[T, React.SetStateAction<T>]}
 */
export const useStateNoCmp = init => {
  const [state, setState] = useState(init);
  const [, rerender] = useReducer(n => n + 1, 0);

  return [
    state,
    value => {
      setState(value);
      rerender();
    },
  ];
};
