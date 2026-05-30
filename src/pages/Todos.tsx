import { useEffect, useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { fetchTodos, createTodo, updateTodo, deleteTodo, TodoItem } from '../lib/supabase'
import Spinner from '../components/Spinner'

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-500/20 text-red-400 border-red-500/30',
  normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low:    'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: '높음', normal: '보통', low: '낮음',
}

const SCHEDULE_LABELS: Record<string, string> = {
  daily: '매일', weekly: '매주', monthly: '매월', once: '1회',
}

type Form = { title: string; schedule_type: string; priority: string; notes: string }
const emptyForm = (): Form => ({ title: '', schedule_type: 'daily', priority: 'normal', notes: '' })

const inp = 'w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors'

export default function TodosPage() {
  const [items, setItems] = useState<TodoItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)

  const load = () => fetchTodos().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    await createTodo({ title: form.title, schedule_type: form.schedule_type, priority: form.priority, notes: form.notes || undefined, is_done: false })
    setForm(emptyForm()); setShowForm(false); load()
  }

  const toggleDone = async (item: TodoItem) => {
    await updateTodo(item.id, { is_done: !item.is_done, done_date: !item.is_done ? new Date().toISOString().slice(0, 10) : undefined })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteTodo(id); load()
  }

  const pending = items.filter(i => !i.is_done)
  const done    = items.filter(i => i.is_done)

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">할 일 관리</h1>
          <p className="text-xs text-slate-400 mt-0.5">정기 점검 · 실험 준비 · 할 일 체크리스트</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500">
          <Plus className="w-4 h-4" />항목 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-400">새 할 일 추가</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 block mb-1">제목 *</label>
              <input className={inp} placeholder="예: ICP-MS 일일 교정" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">일정 유형</label>
              <select className={inp} value={form.schedule_type} onChange={e => setForm({ ...form, schedule_type: e.target.value })}>
                {Object.entries(SCHEDULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">우선순위</label>
              <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 block mb-1">메모</label>
              <input className={inp} placeholder="비고" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex items-center gap-1.5 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500"><Check className="w-3.5 h-3.5" />추가</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 bg-navy-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-600"><X className="w-3.5 h-3.5" />취소</button>
          </div>
        </div>
      )}

      {/* 미완료 */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          미완료 ({pending.length})
        </h2>
        {pending.length === 0 && <p className="text-sm text-slate-500 py-2">모든 할 일을 완료했습니다! 🎉</p>}
        {pending.map(item => (
          <div key={item.id} className={clsx('bg-navy-800 border rounded-xl p-4 flex items-center gap-3', PRIORITY_COLORS[item.priority])}>
            <button
              onClick={() => toggleDone(item)}
              className="w-5 h-5 rounded-full border-2 border-current flex-shrink-0 flex items-center justify-center hover:bg-current/20 transition-colors"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <div className="flex gap-2 mt-0.5 text-[10px]">
                <span className="text-slate-400">{SCHEDULE_LABELS[item.schedule_type] ?? item.schedule_type}</span>
                <span>{PRIORITY_LABELS[item.priority] ?? item.priority}</span>
                {item.notes && <span className="text-slate-500">{item.notes}</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 완료 */}
      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">완료 ({done.length})</h2>
          {done.map(item => (
            <div key={item.id} className="bg-navy-800/50 border border-navy-700 rounded-xl p-4 flex items-center gap-3 opacity-60">
              <button
                onClick={() => toggleDone(item)}
                className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Check className="w-3 h-3 text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 line-through">{item.title}</p>
                {item.done_date && <p className="text-[10px] text-slate-500">완료: {item.done_date}</p>}
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-600 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
