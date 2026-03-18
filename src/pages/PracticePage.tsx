import { useState } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { ALL_CATEGORIES, CATEGORY_LABELS, type PracticeCategory, type Instrument } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePracticeTimer, formatTimer } from '@/hooks/use-practice-timer';

export default function PracticePage() {
  const [, setSessions] = useSessions();
  const [date, setDate] = useState(getTodayEC());
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [categories, setCategories] = useState<PracticeCategory[]>([]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(3);
  const [goal, setGoal] = useState('');

  const { seconds: timerSeconds, running: timerRunning, toggleTimer, resetTimer } = usePracticeTimer();

  // Manual duration
  const [manualHours, setManualHours] = useState(0);
  const [manualMins, setManualMins] = useState(0);
  const [useManual, setUseManual] = useState(false);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleCategory = (cat: PracticeCategory) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const getDurationMinutes = () => {
    if (useManual) return manualHours * 60 + manualMins;
    return Math.max(1, Math.round(timerSeconds / 60));
  };

  const handleSave = () => {
    const duration = getDurationMinutes();
    if (duration <= 0) { toast.error('La duración debe ser mayor a 0'); return; }
    if (categories.length === 0) { toast.error('Selecciona al menos una categoría'); return; }

    const session = {
      id: generateId(),
      date,
      instrument,
      durationMinutes: duration,
      categories,
      notes,
      rating,
      goal,
    };

    setSessions(prev => [...prev, session]);
    toast.success('¡Sesión guardada!');
    handleClear();
  };

  const handleClear = () => {
    setDate(getTodayEC());
    setInstrument('piano');
    setCategories([]);
    setNotes('');
    setRating(3);
    setGoal('');
    resetTimer();
    setManualHours(0);
    setManualMins(0);
    setUseManual(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Registrar Práctica</h1>
          <p className="text-sm text-muted-foreground mt-1">Documenta tu sesión de hoy</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClear}>Limpiar</Button>
          <Button onClick={handleSave}>Guardar Sesión →</Button>
        </div>
      </div>

      <div className="stat-card space-y-6">
        {/* Date & Instrument */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Fecha</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Instrumento</label>
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
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Duración</label>
          {!useManual ? (
            <div className="text-center space-y-3">
              <p className="font-mono text-4xl font-bold text-foreground">{formatTimer(timerSeconds)}</p>
              <div className="flex justify-center gap-2">
                <Button
                  variant={timerRunning ? 'secondary' : 'default'}
                  onClick={() => setTimerRunning(!timerRunning)}
                  size="sm"
                >
                  {timerRunning ? '⏸ Pausa' : '▶ Iniciar'}
                </Button>
                <Button variant="outline" size="sm" onClick={resetTimer}>
                  ↺ Reset
                </Button>
              </div>
              <button onClick={() => setUseManual(true)} className="text-xs text-primary hover:underline">
                ó ingresa manualmente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3 items-center justify-center">
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min={0} max={23} value={manualHours}
                    onChange={e => setManualHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center font-mono"
                  />
                  <span className="text-sm text-muted-foreground">h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min={0} max={59} value={manualMins}
                    onChange={e => setManualMins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center font-mono"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <button onClick={() => setUseManual(false)} className="text-xs text-primary hover:underline block mx-auto">
                usar cronómetro
              </button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">¿Qué practicaste? Selecciona todo lo que aplique</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`chip ${categories.includes(cat) ? 'chip-active' : ''}`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes & Rating */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Notas de la sesión <span className="text-xs">opcional</span></label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="¿Qué trabajaste hoy?" rows={3} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Calidad de sesión</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="text-2xl transition-transform hover:scale-110">
                  {star <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Meta de hoy <span className="text-xs">opcional</span></label>
            <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ej: Dominar escala de Do mayor a 120bpm" />
          </div>
        </div>

        {/* Actions */}
      </div>
    </div>
  );
}
