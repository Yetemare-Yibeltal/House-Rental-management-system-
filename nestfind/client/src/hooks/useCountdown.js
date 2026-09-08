// nestfind/nestfind/client/src/hooks/useCountdown.js

import { useState, useEffect, useCallback, useRef } from "react";

export const useCountdown = (initialSeconds = 60) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(
    (duration = initialSeconds) => {
      setSeconds(duration);
      setIsRunning(true);
    },
    [initialSeconds],
  );

  const stop = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = useCallback(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}:${secs.toString().padStart(2, "0")}`;
    return `${secs}s`;
  }, [seconds]);

  return {
    seconds,
    isRunning,
    isFinished: !isRunning && seconds === 0,
    start,
    stop,
    reset,
    formatTime,
  };
};
