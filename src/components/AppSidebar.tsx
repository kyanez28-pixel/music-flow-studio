import {
  LayoutDashboard, Timer, List, Music2, BookOpen,
  Guitar, Drum, BarChart3, Cross, AudioLines
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSongs, useSetlists } from '@/hooks/use-music-data';
import { getMonday } from '@/lib/music-utils';

const generalItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Registrar Práctica', url: '/practice', icon: Timer },
  { title: 'Metrónomo', url: '/metronome', icon: AudioLines },
  { title: 'Historial', url: '/history', icon: List },
];

const ministryItems = [
  { title: 'Setlist Semanal', url: '/setlist', icon: Cross },
];

const studyItems = [
  { title: 'Escalas', url: '/scales', icon: Music2 },
  { title: 'Armonías', url: '/harmonies', icon: BookOpen },
  { title: 'Melodías', url: '/melodies', icon: Guitar },
  { title: 'Ritmos', url: '/rhythms', icon: Drum },
];

const statsItems = [
  { title: 'Por Período', url: '/stats', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [songs] = useSongs();
  const [setlists] = useSetlists();

  const monday = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const currentSetlist = setlists.find(s => s.weekStart === monday);
  const setlistCount = currentSetlist?.songIds.length ?? 0;

  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof generalItems, badge?: number) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-body">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="hover:bg-sidebar-accent/50 transition-colors"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      <span>{item.title}</span>
                      {item.title === 'Setlist Semanal' && setlistCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-mono">
                          {setlistCount}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <span className="text-2xl">♪</span>
        {!collapsed && (
          <div>
            <h1 className="font-display text-base font-bold text-foreground leading-tight">MusicMinistry</h1>
            <p className="text-xs text-muted-foreground">Estudio Personal</p>
          </div>
        )}
      </div>
      <SidebarContent className="py-2">
        {renderGroup('General', generalItems)}
        {renderGroup('Ministerio', ministryItems)}
        {renderGroup('Estudio', studyItems)}
        {renderGroup('Estadísticas', statsItems)}
      </SidebarContent>
    </Sidebar>
  );
}
