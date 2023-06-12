import { useState, useRef, useEffect } from 'react';

/**
 * Returns the function along with info about the most recent call
 *
 * @param {(...args: any[]) => Promise<any>} asyncFn
 */
export const useAsyncTask = asyncFn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const cancelRef = useRef(false);
  useEffect(() => {
    cancelRef.current = false;
    return () => {
      // Cancel any async state updates that come in after unmounting
      cancelRef.current = true;
    };
  }, []);

  const run = async (...args) => {
    setLoading(true);
    setError(undefined);
    try {
      return await asyncFn(...args);
    } catch (err) {
      if (!cancelRef.current) setError(err);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  };

  return {
    error,
    loading,
    run,
  };
};
