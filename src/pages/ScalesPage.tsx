import { useState } from 'react';
import { useScales } from '@/hooks/use-music-data';
import { generateId } from '@/lib/music-utils';
import { type Scale, type ScaleType, type MasteryLevel, MASTERY_LABELS } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const SCALE_TYPES: { value: ScaleType; label: string }[] = [
  { value: 'mayor', label: 'Mayores' },
  { value: 'menor', label: 'Menores' },
  { value: 'pentatonica', label: 'Pentatónicas' },
  { value: 'blues', label: 'Blues' },
  { value: 'modo', label: 'Modos' },
  { value: 'otro', label: 'Otros' },
];

const MASTERY_OPTIONS: MasteryLevel[] = ['no_iniciado', 'basico', 'en_progreso', 'avanzado', 'dominado'];

export default function ScalesPage() {
  const [scales, setScales] = useScales();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<ScaleType | 'todos'>('todos');
  const [filterInst, setFilterInst] = useState<'piano' | 'guitarra' | 'ambos' | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<ScaleType>('mayor');
  const [subtype, setSubtype] = useState('');
  const [instrument, setInstrument] = useState<'piano' | 'guitarra' | 'ambos'>('ambos');
  const [mastery, setMastery] = useState<MasteryLevel>('no_iniciado');
  const [bpmCurrent, setBpmCurrent] = useState(0);
  const [bpmTarget, setBpmTarget] = useState(0);
  const [notes, setNotes] = useState('');
  const [refUrl, setRefUrl] = useState('');
  const [progress, setProgress] = useState(50);

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setName(''); setType('mayor'); setSubtype(''); setInstrument('ambos');
    setMastery('no_iniciado'); setBpmCurrent(0); setBpmTarget(0);
    setNotes(''); setRefUrl(''); setProgress(50);
  };

  const openEdit = (scale: Scale) => {
    setEditingId(scale.id); setName(scale.name); setType(scale.type);
    setSubtype(scale.subtype); setInstrument(scale.instrument);
    setMastery(scale.mastery); setBpmCurrent(scale.bpmCurrent);
    setBpmTarget(scale.bpmTarget); setNotes(scale.notes);
    setRefUrl(scale.referenceUrl); setProgress(scale.progress);
    setShowForm(true);
  };

  const save = () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    const scale: Scale = {
      id: editingId || generateId(), name, type, subtype, instrument,
      mastery, bpmCurrent, bpmTarget, notes, referenceUrl: refUrl, progress,
    };
    if (editingId) {
      setScales(prev => prev.map(s => s.id === editingId ? scale : s));
      toast.success('Escala actualizada');
    } else {
      setScales(prev => [...prev, scale]);
      toast.success('Escala agregada');
    }
    resetForm();
  };

  const deleteScale = () => {
    setScales(prev => prev.filter(s => s.id !== editingId));
    resetForm();
    toast.success('Escala eliminada');
  };

  const filtered = scales
    .filter(s => filterType === 'todos' || s.type === filterType)
    .filter(s => filterInst === 'todos' || s.instrument === filterInst || s.instrument === 'ambos');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🎼 Escalas</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro y seguimiento de tu dominio de escalas</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nueva Escala</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Todos los tipos</option>
          {SCALE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterInst} onChange={e => setFilterInst(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Ambos instrumentos</option>
          <option value="piano">🎹 Piano</option>
          <option value="guitarra">🎸 Guitarra</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card py-12 text-center">
          <p className="text-muted-foreground">No hay escalas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => (
            <div key={s.id} onClick={() => openEdit(s)} className="stat-card cursor-pointer hover:border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{s.name}</h4>
                <span className="text-xs">{MASTERY_LABELS[s.mastery]}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{s.instrument === 'piano' ? '🎹' : s.instrument === 'guitarra' ? '🎸' : '🎼'} {SCALE_TYPES.find(t => t.value === s.type)?.label}</span>
                {s.bpmCurrent > 0 && <span className="font-mono">{s.bpmCurrent}/{s.bpmTarget} BPM</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nueva'} Escala</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nombre *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Do Mayor" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Subtipo</label>
                <Input value={subtype} onChange={e => setSubtype(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instrumento</label>
                <div className="flex gap-1">
                  {(['piano', 'guitarra', 'ambos'] as const).map(i => (
                    <button key={i} onClick={() => setInstrument(i)}
                      className={`chip flex-1 justify-center text-xs ${instrument === i ? 'chip-active' : ''}`}>
                      {i === 'piano' ? '🎹' : i === 'guitarra' ? '🎸' : '🎼'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dominio</label>
                <select value={mastery} onChange={e => setMastery(e.target.value as MasteryLevel)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                  {MASTERY_OPTIONS.map(m => <option key={m} value={m}>{MASTERY_LABELS[m]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">BPM actual</label>
                <Input type="number" value={bpmCurrent} onChange={e => setBpmCurrent(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">BPM objetivo</label>
                <Input type="number" value={bpmTarget} onChange={e => setBpmTarget(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL de referencia</label>
              <Input value={refUrl} onChange={e => setRefUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Progreso — {progress}%</label>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              {editingId ? <Button variant="destructive" size="sm" onClick={deleteScale}>🗑 Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={save}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
