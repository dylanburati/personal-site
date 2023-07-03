import { useState, useRef, useEffect } from "react";

type AsyncFn<TArgs extends Array<any>, TReturn> = (...args: TArgs) => Promise<TReturn>;

export type AsyncTask<TArgs extends Array<any>, TReturn> = {
  error: any | undefined;
  loading: boolean;
  run: AsyncFn<TArgs, TReturn>;
};

/**
 * Returns the function along with info about the most recent call
 *
 * @param {(...args: any[]) => Promise<any>} asyncFn
 */
export function useAsyncTask<TArgs extends Array<any>, TReturn>(asyncFn: AsyncFn<TArgs, TReturn>): AsyncTask<TArgs, TReturn | undefined> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const cancelRef = useRef(false);
  useEffect(() => {
    cancelRef.current = false;
    return () => {
      // Cancel any async state updates that come in after unmounting
      cancelRef.current = true;
    };
  }, []);

  const run = async (...args: TArgs) => {
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
