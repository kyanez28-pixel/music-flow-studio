import { useState } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { formatDurationLong } from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory } from '@/types/music';

type Period = 'semana' | 'mes' | 'año' | 'todo';

export default function StatsPage() {
  const [sessions] = useSessions();
  const [period, setPeriod] = useState<Period>('mes');

  const now = new Date();
  const filtered = sessions.filter(s => {
    if (period === 'todo') return true;
    const d = new Date(s.date);
    const diff = now.getTime() - d.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (period === 'semana') return days <= 7;
    if (period === 'mes') return days <= 30;
    if (period === 'año') return days <= 365;
    return true;
  });

  const totalMinutes = filtered.reduce((sum, s) => sum + s.durationMinutes, 0);
  const pianoMinutes = filtered.filter(s => s.instrument === 'piano').reduce((sum, s) => sum + s.durationMinutes, 0);
  const guitarMinutes = filtered.filter(s => s.instrument === 'guitarra').reduce((sum, s) => sum + s.durationMinutes, 0);

  // Category breakdown
  const categoryMinutes: Record<PracticeCategory, number> = {} as any;
  ALL_CATEGORIES.forEach(c => { categoryMinutes[c] = 0; });
  filtered.forEach(s => {
    const perCat = s.durationMinutes / (s.categories.length || 1);
    s.categories.forEach(c => { categoryMinutes[c] += perCat; });
  });
  const maxCatMinutes = Math.max(...Object.values(categoryMinutes), 1);

  // Daily activity for the period
  const dayCount = period === 'semana' ? 7 : period === 'mes' ? 30 : period === 'año' ? 52 : 90;
  const activityData: { label: string; minutes: number }[] = [];
  
  if (period === 'semana') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const mins = filtered.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.durationMinutes, 0);
      activityData.push({ label: d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Guayaquil' }), minutes: mins });
    }
  } else {
    // Weekly buckets
    const weeks = period === 'mes' ? 4 : period === 'año' ? 12 : 12;
    for (let w = weeks - 1; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (w + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - w * 7);
      const mins = filtered.filter(s => {
        const d = new Date(s.date);
        return d >= start && d < end;
      }).reduce((sum, s) => sum + s.durationMinutes, 0);
      activityData.push({ label: `S${weeks - w}`, minutes: mins });
    }
  }
  const maxActivity = Math.max(...activityData.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Estadísticas</h1>
        <div className="flex gap-1">
          {(['semana', 'mes', 'año', 'todo'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`chip capitalize ${period === p ? 'chip-active' : ''}`}>
              {p === 'todo' ? 'Todo' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="font-mono text-2xl font-bold text-foreground">{formatDurationLong(totalMinutes)}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-mono text-2xl font-bold text-foreground">{filtered.length}</p>
          <p className="text-sm text-muted-foreground">Sesiones</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-mono text-2xl font-bold text-foreground">
            {filtered.length > 0 ? formatDurationLong(Math.round(totalMinutes / filtered.length)) : '0m'}
          </p>
          <p className="text-sm text-muted-foreground">Promedio</p>
        </div>
      </div>

      {/* Activity chart */}
      <div className="stat-card">
        <h3 className="section-title mb-4">Actividad</h3>
        <div className="flex items-end gap-1.5 h-36">
          {activityData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t transition-all duration-300" style={{
                height: `${Math.max((d.minutes / maxActivity) * 100, 3)}%`,
                background: d.minutes > 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
              }} />
              <span className="text-[10px] text-muted-foreground font-mono">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="stat-card">
        <h3 className="section-title mb-4">Por Categoría</h3>
        <div className="space-y-2">
          {ALL_CATEGORIES.filter(c => categoryMinutes[c] > 0).sort((a, b) => categoryMinutes[b] - categoryMinutes[a]).map(cat => (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1">
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="font-mono text-muted-foreground">{formatDurationLong(Math.round(categoryMinutes[cat]))}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(categoryMinutes[cat] / maxCatMinutes) * 100}%` }} />
              </div>
            </div>
          ))}
          {ALL_CATEGORIES.every(c => categoryMinutes[c] === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos para este período</p>
          )}
        </div>
      </div>

      {/* Piano vs Guitarra */}
      <div className="stat-card">
        <h3 className="section-title mb-4">Piano vs Guitarra</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>🎹 Piano</span>
              <span className="font-mono text-muted-foreground">{formatDurationLong(pianoMinutes)}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: totalMinutes ? `${(pianoMinutes / totalMinutes) * 100}%` : '0%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>🎸 Guitarra</span>
              <span className="font-mono text-muted-foreground">{formatDurationLong(guitarMinutes)}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: totalMinutes ? `${(guitarMinutes / totalMinutes) * 100}%` : '0%', background: 'hsl(var(--warning))' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
