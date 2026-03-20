import { useState, useRef, useCallback, useEffect } from 'react';

export interface MetronomeState {
  bpm: number;
  beatsPerMeasure: number;
  currentBeat: number;
  isPlaying: boolean;
}

export function useMetronome() {
  const [bpm, setBpm] = useState(100);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerMeasure);

  bpmRef.current = bpm;
  beatsRef.current = beatsPerMeasure;

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback((time: number, isAccent: boolean) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Accent beat (first beat) is higher pitch
    osc.frequency.value = isAccent ? 1000 : 700;
    osc.type = 'sine';

    gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.08);
  }, [getAudioContext]);

  const scheduleNote = useCallback(() => {
    const ctx = getAudioContext();
    const secondsPerBeat = 60.0 / bpmRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const isAccent = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isAccent);

      const beatToSet = currentBeatRef.current;
      // Schedule UI update close to the actual sound time
      const delay = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
      setTimeout(() => setCurrentBeat(beatToSet), delay);

      currentBeatRef.current = (currentBeatRef.current + 1) % beatsRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }
  }, [getAudioContext, playClick]);

  const start = useCallback(() => {
    const ctx = getAudioContext();
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime;
    setIsPlaying(true);

    const scheduler = () => {
      scheduleNote();
      timerRef.current = window.setTimeout(scheduler, 25);
    };
    scheduler();
  }, [getAudioContext, scheduleNote]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    currentBeatRef.current = 0;
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // When beats per measure changes while playing, reset beat counter
  useEffect(() => {
    currentBeatRef.current = currentBeatRef.current % beatsPerMeasure;
  }, [beatsPerMeasure]);

  return {
    bpm,
    setBpm,
    beatsPerMeasure,
    setBeatsPerMeasure,
    currentBeat,
    isPlaying,
    toggle,
    start,
    stop,
  };
}
