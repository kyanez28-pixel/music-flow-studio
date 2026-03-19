import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSessions } from '@/hooks/use-music-data';
import { getStreak, formatDurationLong, getTotalMinutes, getTodayEC, getMonday } from '@/lib/music-utils';
import { usePracticeTimer, formatTimer } from '@/hooks/use-practice-timer';

const ROUTE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/practice': 'Registrar Práctica',
  '/history': 'Historial',
  '/setlist': 'Setlist Semanal',
  '/scales': 'Escalas',
  '/harmonies': 'Armonías',
  '/melodies': 'Melodías',
  '/rhythms': 'Ritmos',
  '/stats': 'Estadísticas',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions] = useSessions();
  const streak = getStreak(sessions);
  const today = getTodayEC();
  const monday = getMonday(new Date());
  const mondayStr = monday.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const todayMinutes = getTotalMinutes(sessions.filter(s => s.date === today));
  const weekMinutes = getTotalMinutes(sessions.filter(s => s.date >= mondayStr));
  const routeName = ROUTE_NAMES[location.pathname] ?? '';
  const { seconds, running, toggleTimer } = usePracticeTimer();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">MusicMinistry</span>
                <span className="mx-1.5">/</span>
                <span>{routeName}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Active timer indicator */}
              {(running || seconds > 0) && (
                <button
                  onClick={() => {
                    if (location.pathname !== '/practice') navigate('/practice');
                    else toggleTimer();
                  }}
                  className={`flex items-center gap-2 stat-card py-1.5 px-3 cursor-pointer transition-colors ${running ? 'border-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.2)]' : ''}`}
                >
                  <span className={running ? 'animate-pulse' : ''}>⏱</span>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-foreground">{formatTimer(seconds)}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">{running ? 'en curso' : 'pausado'}</p>
                  </div>
                </button>
              )}
              {/* Streak badge */}
              <div className="flex items-center gap-2 stat-card py-1.5 px-3">
                <span>🔥</span>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-foreground">{streak.current}</p>
                  <p className="text-[10px] text-muted-foreground leading-none">días racha</p>
                </div>
              </div>
              {/* Total time */}
              <div className="stat-card py-1.5 px-3 hidden sm:block">
                <p className="font-mono text-sm font-semibold text-foreground">{formatDurationLong(totalMinutes)}</p>
                <p className="text-[10px] text-muted-foreground leading-none">tiempo total</p>
              </div>
            </div>
          </header>
          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
