import { PracticeSession, Instrument } from '@/types/music';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatDurationLong(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getTodayEC(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'America/Guayaquil'
  });
}

export function getStreak(sessions: PracticeSession[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };
  
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  
  let current = 0;
  let checkDate = new Date(today);
  
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(dateStr)) {
      current++;
    } else if (i > 0) {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Simple best streak calc
  let best = 0;
  let streak = 0;
  const allDates = [...new Set(sessions.map(s => s.date))].sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) { streak = 1; }
    else {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      streak = diff === 1 ? streak + 1 : 1;
    }
    best = Math.max(best, streak);
  }

  return { current, best };
}

export function getTotalMinutes(sessions: PracticeSession[], instrument?: Instrument): number {
  const filtered = instrument ? sessions.filter(s => s.instrument === instrument) : sessions;
  return filtered.reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function getSessionCount(sessions: PracticeSession[], instrument?: Instrument): number {
  return instrument ? sessions.filter(s => s.instrument === instrument).length : sessions.length;
}
