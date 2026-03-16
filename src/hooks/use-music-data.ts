import { useLocalStorage } from './use-local-storage';
import type { PracticeSession, Scale, Harmony, Melody, Rhythm, Song, WeeklySetlist, ScalePracticeLog } from '@/types/music';

export function useSessions() {
  return useLocalStorage<PracticeSession[]>('mm-sessions', []);
}

export function useScales() {
  return useLocalStorage<Scale[]>('mm-scales', []);
}

export function useScaleLogs() {
  return useLocalStorage<ScalePracticeLog[]>('mm-scale-logs', []);
}

export function useHarmonies() {
  return useLocalStorage<Harmony[]>('mm-harmonies', []);
}

export function useMelodies() {
  return useLocalStorage<Melody[]>('mm-melodies', []);
}

export function useRhythms() {
  return useLocalStorage<Rhythm[]>('mm-rhythms', []);
}

export function useSongs() {
  return useLocalStorage<Song[]>('mm-songs', []);
}

export function useSetlists() {
  return useLocalStorage<WeeklySetlist[]>('mm-setlists', []);
}
