import { useState, useMemo } from 'react';
import { useSessions, useScaleLogs } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_SCALES, SCALE_TYPE_OPTIONS, NOTES } from '@/lib/predefined-scales';
import type { Instrument, ScalePracticeLog } from '@/types/music';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ScalesPage() {
  const [sessions, setSessions] = useSessions();
  const [scaleLogs, setScaleLogs] = useScaleLogs();
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterNote, setFilterNote] = useState<string>('todos');
  const [instrument, setInstrument] = useState<Instrument>('piano');

  const today = getTodayEC();

  // Which scales were practiced today for this instrument
  const todayChecked = useMemo(() => {
    const set = new Set<string>();
    scaleLogs
      .filter(l => l.date === today && l.instrument === instrument)
      .forEach(l => set.add(l.scaleId));
    return set;
  }, [scaleLogs, today, instrument]);

  // Filter scales
  const filtered = PREDEFINED_SCALES
    .filter(s => filterType === 'todos' || s.scaleType === filterType)
    .filter(s => filterNote === 'todos' || s.note === filterNote);

  // Stats: total times each scale has been practiced
  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    scaleLogs.forEach(l => {
      counts[l.scaleId] = (counts[l.scaleId] || 0) + 1;
    });
    return counts;
  }, [scaleLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  const toggleScale = (scaleId: string) => {
    const alreadyChecked = todayChecked.has(scaleId);

    if (alreadyChecked) {
      // Remove log
      setScaleLogs(prev =>
        prev.filter(l => !(l.scaleId === scaleId && l.date === today && l.instrument === instrument))
      );
    } else {
      // Add log
      const log: ScalePracticeLog = { scaleId, date: today, instrument };
      setScaleLogs(prev => [...prev, log]);
    }
  };

  // Save today's checked scales as a practice session
  const saveSession = () => {
    const checkedToday = scaleLogs.filter(l => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) {
      toast.error('Marca al menos una escala antes de guardar');
      return;
    }

    // Check if session already exists for today + escalas
    const existingSession = sessions.find(
      s => s.date === today && s.instrument === instrument && s.categories.includes('escalas')
    );

    if (existingSession) {
      // Update notes with scale count
      setSessions(prev =>
        prev.map(s =>
          s.id === existingSession.id
            ? { ...s, notes: `Escalas practicadas: ${checkedToday.length}`, durationMinutes: Math.max(s.durationMinutes, checkedToday.length * 2) }
            : s
        )
      );
      toast.success(`Sesión actualizada: ${checkedToday.length} escalas`);
    } else {
      const session = {
        id: generateId(),
        date: today,
        instrument,
        durationMinutes: checkedToday.length * 2, // ~2 min per scale estimate
        categories: ['escalas' as const],
        notes: `Escalas practicadas: ${checkedToday.length}`,
        rating: 3,
        goal: '',
      };
      setSessions(prev => [...prev, session]);
      toast.success(`¡Sesión guardada! ${checkedToday.length} escalas registradas`);
    }
  };

  const checkedCount = todayChecked.size;
  const totalScales = PREDEFINED_SCALES.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">🎼 Escalas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Marca las escalas que practiques hoy — <span className="font-semibold text-primary">{checkedCount}</span> de {totalScales}
          </p>
        </div>
        <button
          onClick={saveSession}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Guardar Sesión ({checkedCount})
        </button>
      </div>

      {/* Instrument selector */}
      <div className="flex gap-2">
        {(['piano', 'guitarra'] as Instrument[]).map(inst => (
          <button
            key={inst}
            onClick={() => setInstrument(inst)}
            className={`chip flex-1 justify-center ${instrument === inst ? 'chip-active' : ''}`}
          >
            {inst === 'piano' ? '🎹 Piano' : '🎸 Guitarra'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterNote}
          onChange={e => setFilterNote(e.target.value)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border"
        >
          <option value="todos">Todas las notas</option>
          {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border"
        >
          <option value="todos">Todos los tipos</option>
          {SCALE_TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Today's progress */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progreso de hoy</span>
          <span className="text-sm font-mono font-semibold text-primary">{checkedCount}/{filtered.length}</span>
        </div>
        <Progress value={filtered.length > 0 ? (checkedCount / filtered.length) * 100 : 0} className="h-2" />
      </div>

      {/* Scale grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(scale => {
          const checked = todayChecked.has(scale.id);
          const count = practiceCount[scale.id] || 0;
          const progressPct = Math.min(100, (count / maxPractice) * 100);

          return (
            <label
              key={scale.id}
              className={`stat-card flex items-center gap-3 cursor-pointer transition-all hover:border-primary/30 ${
                checked ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleScale(scale.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium truncate ${checked ? 'text-primary' : 'text-foreground'}`}>
                    {scale.label}
                  </span>
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {count}×
                    </span>
                  )}
                </div>
                {count > 0 && (
                  <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary/40 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
