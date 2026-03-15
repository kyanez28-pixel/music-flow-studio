import { useSessions } from '@/hooks/use-music-data';
import { getStreak, getTotalMinutes, getSessionCount, formatDurationLong, formatDate } from '@/lib/music-utils';
import { CATEGORY_LABELS, type PracticeCategory } from '@/types/music';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [sessions] = useSessions();
  const navigate = useNavigate();
  const streak = getStreak(sessions);
  const totalMinutes = getTotalMinutes(sessions);
  const pianoMinutes = getTotalMinutes(sessions, 'piano');
  const guitarMinutes = getTotalMinutes(sessions, 'guitarra');
  const pianoCount = getSessionCount(sessions, 'piano');
  const guitarCount = getSessionCount(sessions, 'guitarra');

  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Activity data for last 4 weeks
  const today = new Date();
  const weeks: { label: string; minutes: number }[] = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (w * 7 + today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const mins = sessions
      .filter(s => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    weeks.push({ label: `Sem ${4 - w}`, minutes: mins });
  }
  const maxWeekMins = Math.max(...weeks.map(w => w.minutes), 1);

  // By instrument pie-like display
  const totalSessions = sessions.length;
  const pianoPercent = totalSessions ? Math.round((pianoCount / totalSessions) * 100) : 0;
  const guitarPercent = totalSessions ? 100 - pianoPercent : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length === 0 ? 'Comienza registrando tu primera sesión' : `${sessions.length} sesiones registradas`}
          </p>
        </div>
        <Button onClick={() => navigate('/practice')} className="gap-2">
          <Plus className="h-4 w-4" /> Sesión
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-2xl mb-1">🎹</p>
          <p className="font-mono text-xl font-bold text-foreground">{formatDurationLong(pianoMinutes)}</p>
          <p className="text-sm text-muted-foreground">Piano Total</p>
          <p className="text-xs text-muted-foreground mt-1">{pianoCount} sesiones</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl mb-1">🎸</p>
          <p className="font-mono text-xl font-bold text-foreground">{formatDurationLong(guitarMinutes)}</p>
          <p className="text-sm text-muted-foreground">Guitarra Total</p>
          <p className="text-xs text-muted-foreground mt-1">{guitarCount} sesiones</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl mb-1">⏱</p>
          <p className="font-mono text-xl font-bold text-foreground">{formatDurationLong(totalMinutes)}</p>
          <p className="text-sm text-muted-foreground">Total Global</p>
          <p className="text-xs text-muted-foreground mt-1">{sessions.length} sesiones</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl mb-1">🔥</p>
          <p className="font-mono text-xl font-bold text-foreground">{streak.current}</p>
          <p className="text-sm text-muted-foreground">Racha Actual</p>
          <p className="text-xs text-muted-foreground mt-1">Mejor: {streak.best} días</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity chart */}
        <div className="stat-card">
          <h3 className="section-title mb-4">Actividad — últimas 4 semanas</h3>
          <div className="flex items-end gap-3 h-32">
            {weeks.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-secondary rounded-t" style={{
                  height: `${Math.max((w.minutes / maxWeekMins) * 100, 4)}%`,
                  background: w.minutes > 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                  transition: 'height 0.3s ease',
                }} />
                <span className="text-xs text-muted-foreground font-mono">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By instrument */}
        <div className="stat-card">
          <h3 className="section-title mb-4">Por instrumento</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>🎹 Piano</span>
                <span className="font-mono text-muted-foreground">{pianoPercent}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pianoPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>🎸 Guitarra</span>
                <span className="font-mono text-muted-foreground">{guitarPercent}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${guitarPercent}%`, background: 'hsl(var(--warning))' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Sesiones Recientes</h3>
          <button onClick={() => navigate('/history')} className="text-sm text-primary hover:underline">Ver todo →</button>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Aún no hay sesiones registradas</p>
        ) : (
          <div className="space-y-2">
            {recent.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{s.instrument === 'piano' ? '🎹' : '🎸'}</span>
                  <div>
                    <p className="text-sm font-medium">{formatDate(s.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.categories.map(c => CATEGORY_LABELS[c]).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{formatDurationLong(s.durationMinutes)}</p>
                  <p className="text-xs text-muted-foreground">{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
