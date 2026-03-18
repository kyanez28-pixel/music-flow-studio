import { useState, useMemo } from 'react';
import { useSessions, useRhythmLogs } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_RHYTHMS, RHYTHM_CATEGORIES } from '@/lib/predefined-rhythms';
import type { Instrument, RhythmPracticeLog } from '@/types/music';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function RhythmsPage() {
  const [sessions, setSessions] = useSessions();
  const [rhythmLogs, setRhythmLogs] = useRhythmLogs();
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [instrument, setInstrument] = useState<Instrument>('piano');

  const today = getTodayEC();

  const todayChecked = useMemo(() => {
    const set = new Set<string>();
    rhythmLogs
      .filter(l => l.date === today && l.instrument === instrument)
      .forEach(l => set.add(l.rhythmItemId));
    return set;
  }, [rhythmLogs, today, instrument]);

  const filtered = PREDEFINED_RHYTHMS
    .filter(r => filterCategory === 'todos' || r.category === filterCategory);

  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    rhythmLogs.forEach(l => {
      counts[l.rhythmItemId] = (counts[l.rhythmItemId] || 0) + 1;
    });
    return counts;
  }, [rhythmLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  const toggleRhythm = (rhythmItemId: string) => {
    const alreadyChecked = todayChecked.has(rhythmItemId);
    if (alreadyChecked) {
      setRhythmLogs(prev =>
        prev.filter(l => !(l.rhythmItemId === rhythmItemId && l.date === today && l.instrument === instrument))
      );
    } else {
      const log: RhythmPracticeLog = { rhythmItemId, date: today, instrument };
      setRhythmLogs(prev => [...prev, log]);
    }
  };

  const saveSession = () => {
    const checkedToday = rhythmLogs.filter(l => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) {
      toast.error('Marca al menos un ritmo antes de guardar');
      return;
    }

    const names = checkedToday
      .map(l => PREDEFINED_RHYTHMS.find(r => r.id === l.rhythmItemId)?.name)
      .filter(Boolean)
      .join(', ');
    const notesText = `Ritmos (${checkedToday.length}): ${names}`;

    const existingSession = sessions.find(
      s => s.date === today && s.instrument === instrument && s.categories.includes('ritmos')
    );

    if (existingSession) {
      setSessions(prev =>
        prev.map(s =>
          s.id === existingSession.id
            ? { ...s, notes: notesText, durationMinutes: Math.max(s.durationMinutes, checkedToday.length * 2) }
            : s
        )
      );
    } else {
      const session = {
        id: generateId(),
        date: today,
        instrument,
        durationMinutes: checkedToday.length * 2,
        categories: ['ritmos' as const],
        notes: notesText,
        rating: 3,
        goal: '',
      };
      setSessions(prev => [...prev, session]);
    }

    setRhythmLogs(prev => prev.filter(l => !(l.date === today && l.instrument === instrument)));
    toast.success(`¡Sesión guardada! ${checkedToday.length} ritmos registrados`);
  };

  const checkedCount = todayChecked.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">🥁 Ritmos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Marca los ritmos que practiques hoy — <span className="font-semibold text-primary">{checkedCount}</span> de {filtered.length}
          </p>
        </div>
        <button
          onClick={saveSession}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Guardar Sesión ({checkedCount})
        </button>
      </div>

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

      <div className="flex flex-wrap gap-2">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border"
        >
          <option value="todos">Todas las categorías</option>
          {RHYTHM_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progreso de hoy</span>
          <span className="text-sm font-mono font-semibold text-primary">{checkedCount}/{filtered.length}</span>
        </div>
        <Progress value={filtered.length > 0 ? (checkedCount / filtered.length) * 100 : 0} className="h-2" />
      </div>

      {RHYTHM_CATEGORIES
        .filter(cat => filterCategory === 'todos' || filterCategory === cat.key)
        .map(cat => {
          const items = PREDEFINED_RHYTHMS.filter(r => r.category === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map(rhythm => {
                  const checked = todayChecked.has(rhythm.id);
                  const count = practiceCount[rhythm.id] || 0;
                  const progressPct = Math.min(100, (count / maxPractice) * 100);

                  return (
                    <label
                      key={rhythm.id}
                      className={`stat-card flex items-center gap-3 cursor-pointer transition-all hover:border-primary/30 ${
                        checked ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleRhythm(rhythm.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium truncate ${checked ? 'text-primary' : 'text-foreground'}`}>
                            {rhythm.name}
                          </span>
                          {count > 0 && (
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                              {count}×
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{rhythm.description}</p>
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
        })}
    </div>
  );
}
