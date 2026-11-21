import { useCallback, useEffect, useRef, useState } from "react";
import { getTmdbCooldownSeconds } from "../api/tmdb";

const MIN_RETRY_DELAY_SECONDS = 2;
const MIN_RATE_LIMIT_DELAY_SECONDS = 5;

/**
 * Loads one TMDb resource and exposes a retry action that is protected by a
 * cooldown, so repeatedly pressing "Try again" cannot create a request storm.
 *
 * `fetcher(signal)` is called again whenever `key` changes. Pass every value
 * the fetcher depends on (for example the page number) through `key`.
 */
export function useTmdbQuery(fetcher, key, { label = "movie data", enabled = true } = {}) {
  const fetcherRef = useRef(fetcher);
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [attempt, setAttempt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetcherRef.current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (error?.name === "AbortError" || controller.signal.aborted) return;
        console.error("Unable to load " + label + ":", error);
        const floor = error?.kind === "rate_limit" ? MIN_RATE_LIMIT_DELAY_SECONDS : MIN_RETRY_DELAY_SECONDS;
        const seconds = Math.max(floor, error?.retryAfter ?? 0, getTmdbCooldownSeconds());
        setNow(Date.now());
        setRetryAt(Date.now() + seconds * 1000);
        setState({ data: null, loading: false, error });
      });

    return () => controller.abort();
  }, [key, attempt, enabled, label]);

  useEffect(() => {
    if (retryAt <= Date.now()) return undefined;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= retryAt) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  const cooldownSeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));

  const retry = useCallback(() => {
    if (state.loading || cooldownSeconds > 0) return;
    setAttempt((value) => value + 1);
  }, [state.loading, cooldownSeconds]);

  return { ...state, retry, cooldownSeconds };
}
