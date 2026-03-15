import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useSessions } from '@/hooks/use-music-data';
import { getStreak, formatDurationLong, getTotalMinutes } from '@/lib/music-utils';

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
  const [sessions] = useSessions();
  const streak = getStreak(sessions);
  const totalMinutes = getTotalMinutes(sessions);
  const routeName = ROUTE_NAMES[location.pathname] ?? '';

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
            <div className="flex items-center gap-4">
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
