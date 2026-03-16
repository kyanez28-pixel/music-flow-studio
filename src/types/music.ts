export type Instrument = 'piano' | 'guitarra';

export type PracticeCategory =
  | 'escalas' | 'armonias' | 'melodias' | 'ritmos'
  | 'ministerio' | 'acordes' | 'lectura' | 'improvisacion'
  | 'calentamiento' | 'tecnica';

export const CATEGORY_LABELS: Record<PracticeCategory, string> = {
  escalas: '🎼 Escalas',
  armonias: '🎶 Armonías',
  melodias: '🎵 Melodías',
  ritmos: '🥁 Ritmos',
  ministerio: '✝ Ministerio',
  acordes: '🤙 Acordes',
  lectura: '📄 Lectura',
  improvisacion: '✨ Improvisación',
  calentamiento: '🤸 Calentamiento',
  tecnica: '💪 Técnica',
};

export const ALL_CATEGORIES: PracticeCategory[] = Object.keys(CATEGORY_LABELS) as PracticeCategory[];

export interface PracticeSession {
  id: string;
  date: string;
  instrument: Instrument;
  durationMinutes: number;
  categories: PracticeCategory[];
  notes: string;
  rating: number;
  goal: string;
}

export type ScaleType = 'mayor' | 'menor' | 'pentatonica' | 'blues' | 'modo' | 'otro';
export type MasteryLevel = 'no_iniciado' | 'basico' | 'en_progreso' | 'avanzado' | 'dominado';

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  no_iniciado: '🔴 No iniciado',
  basico: '🟠 Básico',
  en_progreso: '🟡 En progreso',
  avanzado: '🔵 Avanzado',
  dominado: '🟢 Dominado',
};

export interface Scale {
  id: string;
  name: string;
  type: ScaleType;
  subtype: string;
  instrument: Instrument | 'ambos';
  mastery: MasteryLevel;
  bpmCurrent: number;
  bpmTarget: number;
  notes: string;
  referenceUrl: string;
  progress: number;
}

export type HarmonyType = 'progresion' | 'acorde' | 'voicing' | 'cadencia' | 'otro';

export interface Harmony {
  id: string;
  name: string;
  type: HarmonyType;
  description: string;
  notes: string;
}

export type MelodyStatus = 'aprendiendo' | 'practicando' | 'dominada';

export interface Melody {
  id: string;
  name: string;
  instrument: Instrument | 'ambos';
  status: MelodyStatus;
  bpm: number;
  key: string;
  timeSignature: string;
  description: string;
  progress: number;
  files: string[];
}

export type RhythmType = 'balada' | 'vals' | 'pop' | 'gospel' | 'latino' | 'otro';

export interface Rhythm {
  id: string;
  name: string;
  type: RhythmType;
  description: string;
  bpm: number;
  timeSignature: string;
}

export type SongGenre = 'adoracion' | 'alabanza' | 'himno' | 'contemporaneo' | 'instrumental';

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  genre: SongGenre;
  instrument: Instrument | 'ambos';
  notes: string;
  referenceUrl: string;
}

export interface WeeklySetlist {
  weekStart: string; // ISO date of Monday
  songIds: string[];
  rehearsalNotes: string;
}

export interface ScalePracticeLog {
  scaleId: string; // matches PredefinedScale.id
  date: string; // ISO date
  instrument: Instrument;
}
