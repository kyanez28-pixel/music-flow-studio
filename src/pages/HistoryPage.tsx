import { useState } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { formatDate, formatDurationLong } from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory, type Instrument } from '@/types/music';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [sessions, setSessions] = useSessions();
  const [filterInstrument, setFilterInstrument] = useState<Instrument | 'todos'>('todos');
  const [filterCategory, setFilterCategory] = useState<PracticeCategory | 'todas'>('todas');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = sessions
    .filter(s => filterInstrument === 'todos' || s.instrument === filterInstrument)
    .filter(s => filterCategory === 'todas' || s.categories.includes(filterCategory))
    .sort((a, b) => b.date.localeCompare(a.date));

  const editSession = sessions.find(s => s.id === editId);
  const [editDate, setEditDate] = useState('');
  const [editInstrument, setEditInstrument] = useState<Instrument>('piano');
  const [editHours, setEditHours] = useState(0);
  const [editMins, setEditMins] = useState(0);
  const [editCategories, setEditCategories] = useState<PracticeCategory[]>([]);
  const [editNotes, setEditNotes] = useState('');

  const openEdit = (id: string) => {
    const s = sessions.find(x => x.id === id);
    if (!s) return;
    setEditId(id);
    setEditDate(s.date);
    setEditInstrument(s.instrument);
    setEditHours(Math.floor(s.durationMinutes / 60));
    setEditMins(s.durationMinutes % 60);
    setEditCategories([...s.categories]);
    setEditNotes(s.notes);
  };

  const saveEdit = () => {
    setSessions(prev => prev.map(s => s.id === editId ? {
      ...s, date: editDate, instrument: editInstrument,
      durationMinutes: editHours * 60 + editMins,
      categories: editCategories, notes: editNotes,
    } : s));
    setEditId(null);
    toast.success('Sesión actualizada');
  };

  const confirmDelete = () => {
    setSessions(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    setEditId(null);
    toast.success('Sesión eliminada');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Historial</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} sesiones registradas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterInstrument}
          onChange={e => setFilterInstrument(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border"
        >
          <option value="todos">Todos los instrumentos</option>
          <option value="piano">🎹 Piano</option>
          <option value="guitarra">🎸 Guitarra</option>
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border"
        >
          <option value="todas">Todas las categorías</option>
          {ALL_CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="stat-card py-12 text-center">
          <p className="text-muted-foreground">No hay sesiones que mostrar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => openEdit(s.id)}
              className="stat-card flex items-center justify-between cursor-pointer hover:border-primary/30"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xl shrink-0">{s.instrument === 'piano' ? '🎹' : '🎸'}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{formatDate(s.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.categories.map(c => CATEGORY_LABELS[c]).join(', ')}
                  </p>
                  {s.notes && (
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{s.notes}</p>
                  )}
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

      {/* Edit modal */}
      <Dialog open={!!editId} onOpenChange={open => { if (!open) setEditId(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Sesión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Fecha</label>
                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Instrumento</label>
                <div className="flex gap-2 mt-1">
                  {(['piano', 'guitarra'] as Instrument[]).map(inst => (
                    <button key={inst} onClick={() => setEditInstrument(inst)}
                      className={`chip flex-1 justify-center text-xs ${editInstrument === inst ? 'chip-active' : ''}`}>
                      {inst === 'piano' ? '🎹' : '🎸'} {inst}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Horas</label>
                <Input type="number" min={0} value={editHours} onChange={e => setEditHours(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Minutos</label>
                <Input type="number" min={0} max={59} value={editMins} onChange={e => setEditMins(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categorías</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map(cat => (
                  <button key={cat}
                    onClick={() => setEditCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                    className={`chip text-xs ${editCategories.includes(cat) ? 'chip-active' : ''}`}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas</label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <Button variant="destructive" size="sm" onClick={() => setDeleteId(editId)}>🗑 Eliminar</Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Cancelar</Button>
                <Button size="sm" onClick={saveEdit}>Guardar Cambios</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent className="bg-card border-border max-w-sm text-center">
          <p className="text-4xl mb-2">⚠</p>
          <p className="font-display text-lg">¿Eliminar esta sesión?</p>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Sí, eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
