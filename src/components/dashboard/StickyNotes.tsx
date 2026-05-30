import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Pin, ClipboardList, Cloud, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

interface Note { id: string; content: string; pinned: boolean; updatedAt: string }
const STORAGE_KEY = 'lab_sticky_notes'
const SYNC_KEY = 'lab_sticky_notes_synced'
const DEFAULT_NOTES: Note[] = [{ id: '1', content: '2,4째주 금요일은 청소\n출근 9시 10분까지', pinned: true, updatedAt: new Date().toISOString() }]

function NoteEditor({ note, onSave, onCancel }: { note: Note; onSave: (c: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const composing = useRef(false)
  useEffect(() => { ref.current?.focus(); const l = ref.current?.value.length ?? 0; ref.current?.setSelectionRange(l, l) }, [])
  const save = () => { if (!composing.current) onSave(ref.current?.value ?? '') }
  return (
    <textarea ref={ref} defaultValue={note.content}
      className="w-full h-full bg-transparent text-yellow-950 text-[11px] resize-none outline-none p-2.5 pt-7 font-medium leading-snug"
      placeholder="메모..." maxLength={80}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={() => { composing.current = false }}
      onBlur={() => setTimeout(save, 50)}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel() } }}
    />
  )
}

export default function StickyNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed: Note[] = saved ? JSON.parse(saved) : DEFAULT_NOTES
    setNotes(parsed)
    setActiveId(parsed.find(n => n.pinned)?.id ?? parsed[0]?.id ?? null)
    setLastSynced(localStorage.getItem(SYNC_KEY))
  }, [])

  const persist = useCallback((updated: Note[]) => {
    setNotes(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  const sync = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    const now = new Date().toISOString(); localStorage.setItem(SYNC_KEY, now); setLastSynced(now)
  }

  const saveNote = (id: string, content: string) => {
    setNotes(prev => { const u = prev.map(n => n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u })
    setEditingId(null)
  }

  const addNote = () => {
    const note: Note = { id: Date.now().toString(), content: '', pinned: false, updatedAt: new Date().toISOString() }
    persist([note, ...notes]); setActiveId(note.id); setEditingId(note.id); setShowList(false)
  }

  const deleteNote = (id: string) => {
    if (editingId === id) setEditingId(null)
    const u = notes.filter(n => n.id !== id); persist(u)
    if (activeId === id) setActiveId(u.find(n => n.pinned)?.id ?? u[0]?.id ?? null)
  }

  const togglePin = (id: string) => persist(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  const activeNote = notes.find(n => n.id === activeId) ?? notes[0]

  const NoteSquare = ({ note, compact }: { note: Note; compact?: boolean }) => (
    <div className={clsx('relative rounded-sm shadow-lg', compact ? 'w-[108px] h-[108px]' : 'w-[140px] h-[140px] mx-auto')}
      style={{ background: 'linear-gradient(160deg,#fef08a 0%,#fde047 55%,#facc15 100%)', boxShadow: '2px 3px 8px rgba(0,0,0,0.25)', transform: note.pinned ? 'rotate(-1.5deg)' : 'rotate(0.5deg)' }}
      onDoubleClick={() => { if (compact) { setActiveId(note.id); setShowList(false); setEditingId(note.id) } }}>
      <div className="absolute top-1 right-1 flex gap-0.5 z-10">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => togglePin(note.id)}
          className={clsx('w-5 h-5 rounded-sm flex items-center justify-center transition-colors', note.pinned ? 'bg-amber-200/80 text-amber-900' : 'bg-black/5 text-yellow-900/40 hover:bg-amber-200/60')}>
          <Pin className="w-3 h-3" />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => deleteNote(note.id)}
          className="w-5 h-5 rounded-sm flex items-center justify-center bg-black/5 text-yellow-900/40 hover:text-red-700 hover:bg-red-100/60">
          <X className="w-3 h-3" />
        </button>
      </div>
      {editingId === note.id
        ? <NoteEditor key={note.id} note={note} onSave={c => saveNote(note.id, c)} onCancel={() => setEditingId(null)} />
        : <div role="button" tabIndex={0} className="w-full h-full cursor-text p-2.5 pt-7" onClick={() => { setEditingId(note.id); setActiveId(note.id) }} onKeyDown={e => { if (e.key === 'Enter') setEditingId(note.id) }}>
            <p className="text-yellow-950 text-[11px] whitespace-pre-wrap font-medium leading-snug h-full overflow-hidden pointer-events-none">{note.content || '클릭하여 입력'}</p>
          </div>
      }
    </div>
  )

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-navy-600">
        <h3 className="text-sm font-medium text-white">📌 스티커 메모</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowList(!showList)} className={clsx('flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors', showList ? 'bg-navy-700 text-cyan-400' : 'text-slate-400 hover:bg-navy-700')}>
            <ClipboardList className="w-3 h-3" />목록 ({notes.length})
          </button>
          <button onClick={addNote} className="w-7 h-7 rounded border border-dashed border-navy-600 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-colors" title="메모 추가">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 px-3 py-4 min-h-[168px] flex items-center justify-center">
        {notes.length === 0
          ? <button onClick={addNote} className="w-[140px] h-[140px] rounded-sm border-2 border-dashed border-navy-600 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors"><Plus className="w-5 h-5" /><span className="text-xs">메모 추가</span></button>
          : showList
          ? <div className="flex flex-wrap gap-3 justify-center w-full">{notes.map(n => <NoteSquare key={n.id} note={n} compact />)}</div>
          : activeNote ? <NoteSquare note={activeNote} /> : null
        }
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-navy-600 bg-navy-900/40">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Cloud className="w-3 h-3" />{lastSynced ? <span>동기화됨 · {lastSynced.slice(0, 16)}</span> : <span>로컬 저장</span>}</div>
        <button onClick={sync} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-cyan-400 hover:bg-navy-700 transition-colors"><RefreshCw className="w-3 h-3" />동기화</button>
      </div>
    </div>
  )
}
