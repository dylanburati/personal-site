import { useState } from 'react';

/**
 * Returns the function along with info about the most recent call
 *
 * @param {(...args: any[]) => Promise<any>} asyncFn
 */
export const useAsyncTask = asyncFn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const run = async (...args) => {
    setLoading(true);
    setError(undefined);
    try {
      return await asyncFn(...args);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    run,
  };
};
