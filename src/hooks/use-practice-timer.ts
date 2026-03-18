import { useState, useRef, useEffect, useCallback } from 'react';

const TIMER_STORAGE_KEY = 'practice-timer';

export interface TimerState {
  startedAt: number | null;
  accumulatedMs: number;
  running: boolean;
}

function loadTimerState(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startedAt: null, accumulatedMs: 0, running: false };
}

function saveTimerState(state: TimerState) {
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
}

function getElapsedSeconds(state: TimerState): number {
  let ms = state.accumulatedMs;
  if (state.running && state.startedAt) {
    ms += Date.now() - state.startedAt;
  }
  return Math.floor(ms / 1000);
}

export function formatTimer(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function usePracticeTimer() {
  const [timerState, setTimerState] = useState<TimerState>(loadTimerState);
  const [displaySeconds, setDisplaySeconds] = useState(() => getElapsedSeconds(loadTimerState()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState]);

  useEffect(() => {
    if (timerState.running) {
      setDisplaySeconds(getElapsedSeconds(timerState));
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(getElapsedSeconds(timerState));
      }, 1000);
    } else {
      setDisplaySeconds(getElapsedSeconds(timerState));
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  const startTimer = useCallback(() => {
    setTimerState(prev => {
      if (!prev.running) {
        return { ...prev, startedAt: Date.now(), running: true };
      }
      return prev;
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => {
      if (prev.running) {
        const elapsed = prev.startedAt ? Date.now() - prev.startedAt : 0;
        return { accumulatedMs: prev.accumulatedMs + elapsed, startedAt: null, running: false };
      }
      return prev;
    });
  }, []);

  const resetTimer = useCallback(() => {
    const reset: TimerState = { startedAt: null, accumulatedMs: 0, running: false };
    setTimerState(reset);
    setDisplaySeconds(0);
  }, []);

  const toggleTimer = useCallback(() => {
    setTimerState(prev => {
      if (prev.running) {
        const elapsed = prev.startedAt ? Date.now() - prev.startedAt : 0;
        return { accumulatedMs: prev.accumulatedMs + elapsed, startedAt: null, running: false };
      }
      return { ...prev, startedAt: Date.now(), running: true };
    });
  }, []);

  return {
    seconds: displaySeconds,
    running: timerState.running,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleTimer,
  };
}
