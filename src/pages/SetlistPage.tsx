import { useState } from 'react';
import { useSongs, useSetlists } from '@/hooks/use-music-data';
import { getMonday, generateId } from '@/lib/music-utils';
import { type Song, type SongGenre } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const GENRES: { value: SongGenre; label: string }[] = [
  { value: 'adoracion', label: 'Adoración' },
  { value: 'alabanza', label: 'Alabanza' },
  { value: 'himno', label: 'Himno' },
  { value: 'contemporaneo', label: 'Contemporáneo' },
  { value: 'instrumental', label: 'Instrumental' },
];

export default function SetlistPage() {
  const [songs, setSongs] = useSongs();
  const [setlists, setSetlists] = useSetlists();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddSong, setShowAddSong] = useState(false);
  const [filterGenre, setFilterGenre] = useState<SongGenre | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Song form
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [songGenre, setSongGenre] = useState<SongGenre>('adoracion');
  const [songInstrument, setSongInstrument] = useState<'piano' | 'guitarra' | 'ambos'>('ambos');
  const [songNotes, setSongNotes] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  const monday = new Date();
  monday.setDate(monday.getDate() + weekOffset * 7);
  const mondayDate = getMonday(monday);
  const mondayStr = mondayDate.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const weekLabel = `${mondayDate.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'America/Guayaquil' })} — ${sundayDate.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Guayaquil' })}`;

  const currentSetlist = setlists.find(s => s.weekStart === mondayStr) || { weekStart: mondayStr, songIds: [], rehearsalNotes: '' };
  const setlistSongs = currentSetlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];

  const [rehearsalNotes, setRehearsalNotes] = useState(currentSetlist.rehearsalNotes);

  const updateSetlist = (update: Partial<typeof currentSetlist>) => {
    const updated = { ...currentSetlist, ...update };
    setSetlists(prev => {
      const idx = prev.findIndex(s => s.weekStart === mondayStr);
      if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
      return [...prev, updated];
    });
  };

  const addToSetlist = (songId: string) => {
    if (currentSetlist.songIds.includes(songId)) return;
    updateSetlist({ songIds: [...currentSetlist.songIds, songId] });
    toast.success('Canción agregada al setlist');
  };

  const removeFromSetlist = (songId: string) => {
    updateSetlist({ songIds: currentSetlist.songIds.filter(id => id !== songId) });
  };

  const saveSong = () => {
    if (!songTitle.trim()) { toast.error('El título es requerido'); return; }
    const song: Song = {
      id: editingSongId || generateId(),
      title: songTitle, artist: songArtist, key: songKey,
      genre: songGenre, instrument: songInstrument,
      notes: songNotes, referenceUrl: songUrl,
    };
    if (editingSongId) {
      setSongs(prev => prev.map(s => s.id === editingSongId ? song : s));
      toast.success('Canción actualizada');
    } else {
      setSongs(prev => [...prev, song]);
      toast.success('Canción agregada a la biblioteca');
    }
    resetSongForm();
  };

  const resetSongForm = () => {
    setShowAddSong(false);
    setEditingSongId(null);
    setSongTitle(''); setSongArtist(''); setSongKey('');
    setSongGenre('adoracion'); setSongInstrument('ambos');
    setSongNotes(''); setSongUrl('');
  };

  const editSong = (song: Song) => {
    setEditingSongId(song.id);
    setSongTitle(song.title); setSongArtist(song.artist); setSongKey(song.key);
    setSongGenre(song.genre); setSongInstrument(song.instrument);
    setSongNotes(song.notes); setSongUrl(song.referenceUrl);
    setShowAddSong(true);
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    setSetlists(prev => prev.map(sl => ({ ...sl, songIds: sl.songIds.filter(sid => sid !== id) })));
    resetSongForm();
    toast.success('Canción eliminada');
  };

  const filteredSongs = songs
    .filter(s => filterGenre === 'todos' || s.genre === filterGenre)
    .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">✝ Setlist Semanal</h1>
        <p className="text-sm text-muted-foreground mt-1">Repaso y organización del repertorio del ministerio</p>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between stat-card py-3">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-mono text-sm">{weekLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Setlist */}
        <div className="stat-card">
          <h3 className="section-title mb-1">Setlist de la Semana</h3>
          <p className="text-xs text-muted-foreground mb-3">{setlistSongs.length} canciones</p>
          {setlistSongs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Agrega canciones desde la biblioteca</p>
          ) : (
            <div className="space-y-1.5">
              {setlistSongs.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.artist} · {s.key}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromSetlist(s.id)} className="text-destructive text-sm hover:underline">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rehearsal notes */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="section-title">Notas de Ensayo</h3>
            <Button size="sm" variant="ghost" onClick={() => { updateSetlist({ rehearsalNotes }); toast.success('Notas guardadas'); }}>
              💾 Guardar
            </Button>
          </div>
          <Textarea
            value={rehearsalNotes}
            onChange={e => setRehearsalNotes(e.target.value)}
            rows={6}
            placeholder="Anota observaciones del ensayo..."
          />
        </div>
      </div>

      {/* Song library */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">📚 Base de Datos de Canciones</h3>
          <Button size="sm" onClick={() => setShowAddSong(true)}>
            <Plus className="h-3 w-3 mr-1" /> Agregar a biblioteca
          </Button>
        </div>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
          <select value={filterGenre} onChange={e => setFilterGenre(e.target.value as any)}
            className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
            <option value="todos">Todos los géneros</option>
            {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        {filteredSongs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No hay canciones en la biblioteca</p>
        ) : (
          <div className="space-y-1.5">
            {filteredSongs.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-secondary/20 rounded-md hover:bg-secondary/40 transition-colors">
                <div className="cursor-pointer" onClick={() => editSong(s)}>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.artist} · {s.key} · {GENRES.find(g => g.value === s.genre)?.label}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => addToSetlist(s.id)}>+ Setlist</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Song dialog */}
      <Dialog open={showAddSong} onOpenChange={open => { if (!open) resetSongForm(); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingSongId ? 'Editar' : 'Agregar'} Canción</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Título *</label>
                <Input value={songTitle} onChange={e => setSongTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Artista / Autor</label>
                <Input value={songArtist} onChange={e => setSongArtist(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Tonalidad</label>
                <Input value={songKey} onChange={e => setSongKey(e.target.value)} placeholder="Ej: D, Am" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Género</label>
                <select value={songGenre} onChange={e => setSongGenre(e.target.value as SongGenre)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                  {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mi instrumento en esta canción</label>
              <div className="flex gap-2">
                {(['piano', 'guitarra', 'ambos'] as const).map(inst => (
                  <button key={inst} onClick={() => setSongInstrument(inst)}
                    className={`chip flex-1 justify-center text-xs ${songInstrument === inst ? 'chip-active' : ''}`}>
                    {inst === 'piano' ? '🎹 Piano' : inst === 'guitarra' ? '🎸 Guitarra' : '🎼 Ambos'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas / Acordes / Estructura</label>
              <Textarea value={songNotes} onChange={e => setSongNotes(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL de referencia</label>
              <Input value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="YouTube, Spotify..." />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              {editingSongId ? (
                <Button variant="destructive" size="sm" onClick={() => deleteSong(editingSongId!)}>🗑 Eliminar</Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetSongForm}>Cancelar</Button>
                <Button size="sm" onClick={saveSong}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
