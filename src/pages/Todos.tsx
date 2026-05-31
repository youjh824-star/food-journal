import { useEffect, useState } from 'react'
import { Plus, Trash2, Check, X, Pencil, Calendar, Repeat } from 'lucide-react'
import clsx from 'clsx'
import { fetchTodos, createTodo, updateTodo, deleteTodo, TodoItem } from '../lib/supabase'
import Spinner from '../components/Spinner'

const PRIORITY_COLORS: Record<string, string> = {
  high:   'border-red-500/40',
  normal: 'border-blue-500/40',
  low:    'border-slate-500/30',
}
const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-500/20 text-red-400',
  normal: 'bg-blue-500/20 text-blue-400',
  low:    'bg-slate-500/20 text-slate-400',
}
const PRIORITY_LABELS: Record<string, string> = { high: '높음', normal: '보통', low: '낮음' }
const SCHEDULE_LABELS: Record<string, string> = { daily: '매일', weekly: '매주', monthly: '매월', once: '1회' }
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly'
type Form = {
  title: string
  schedule_type: ScheduleType
  priority: string
  notes: string
  due_date: string
  recurrence_weekday: number
  recurrence_day: number
}

const emptyForm = (): Form => ({
  title: '', schedule_type: 'once', priority: 'normal', notes: '',
  due_date: '', recurrence_weekday: 0, recurrence_day: 1,
})

function itemToForm(item: TodoItem): Form {
  return {
    title: item.title,
    schedule_type: (item.schedule_type ?? 'once') as ScheduleType,
    priority: item.priority ?? 'normal',
    notes: item.notes ?? '',
    due_date: '',
    recurrence_weekday: item.recurrence_weekday ?? 0,
    recurrence_day: item.recurrence_day ?? 1,
  }
}

function scheduleSummary(item: TodoItem): string {
  const st = item.schedule_type ?? 'once'
  if (st === 'daily') return '매일'
  if (st === 'weekly') return `매주 ${WEEKDAYS[item.recurrence_weekday ?? 0]}요일`
  if (st === 'monthly') return `매월 ${item.recurrence_day ?? 1}일`
  return '1회'
}

const inp = 'w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors'

function TodoForm({
  form, onChange, onSubmit, onCancel, submitLabel,
}: {
  form: Form; onChange: (f: Form) => void
  onSubmit: () => void; onCancel: () => void; submitLabel: string
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[11px] text-slate-400 block mb-1">제목 *</label>
          <input className={inp} placeholder="할 일 제목" value={form.title}
            onChange={e => onChange({ ...form, title: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">일정 유형</label>
          <select className={inp} value={form.schedule_type}
            onChange={e => onChange({ ...form, schedule_type: e.target.value as ScheduleType })}>
            <option value="once">1회</option>
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">우선순위</label>
          <select className={inp} value={form.priority}
            onChange={e => onChange({ ...form, priority: e.target.value })}>
            <option value="high">높음</option>
            <option value="normal">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {form.schedule_type === 'weekly' && (
          <div className="col-span-2">
            <label className="text-[11px] text-slate-400 block mb-1">요일</label>
            <select className={inp} value={form.recurrence_weekday}
              onChange={e => onChange({ ...form, recurrence_weekday: Number(e.target.value) })}>
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}요일</option>)}
            </select>
          </div>
        )}
        {form.schedule_type === 'monthly' && (
          <div className="col-span-2">
            <label className="text-[11px] text-slate-400 block mb-1">매월 일자</label>
            <input type="number" min={1} max={31} className={inp} value={form.recurrence_day}
              onChange={e => onChange({ ...form, recurrence_day: Number(e.target.value) })} />
          </div>
        )}

        <div className="col-span-2">
          <label className="text-[11px] text-slate-400 block mb-1">메모</label>
          <input className={inp} placeholder="비고 (선택)" value={form.notes}
            onChange={e => onChange({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSubmit} disabled={!form.title.trim()}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Check className="w-3.5 h-3.5" />{submitLabel}
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <X className="w-3.5 h-3.5" />취소
        </button>
      </div>
    </div>
  )
}

export default function TodosPage() {
  const [items, setItems]         = useState<TodoItem[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm]   = useState(emptyForm())
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'pending' | 'done'>('all')

  const load = () => fetchTodos().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    await createTodo({
      title: form.title,
      schedule_type: form.schedule_type,
      priority: form.priority,
      notes: form.notes || undefined,
      recurrence_weekday: form.schedule_type === 'weekly' ? form.recurrence_weekday : undefined,
      recurrence_day: form.schedule_type === 'monthly' ? form.recurrence_day : undefined,
      is_done: false,
    })
    setForm(emptyForm()); setShowForm(false); load()
  }

  const handleUpdate = async () => {
    if (editingId == null || !editForm.title.trim()) return
    await updateTodo(editingId, {
      title: editForm.title,
      schedule_type: editForm.schedule_type,
      priority: editForm.priority,
      notes: editForm.notes || undefined,
      recurrence_weekday: editForm.schedule_type === 'weekly' ? editForm.recurrence_weekday : undefined,
      recurrence_day: editForm.schedule_type === 'monthly' ? editForm.recurrence_day : undefined,
    })
    setEditingId(null); load()
  }

  const toggleDone = async (item: TodoItem) => {
    await updateTodo(item.id, {
      is_done: !item.is_done,
      done_date: !item.is_done ? new Date().toISOString().slice(0, 10) : undefined,
    })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    if (editingId === id) setEditingId(null)
    await deleteTodo(id); load()
  }

  const startEdit = (item: TodoItem) => {
    setEditingId(item.id)
    setEditForm(itemToForm(item))
    setShowForm(false)
  }

  const displayed = items.filter(i => {
    if (filter === 'pending') return !i.is_done
    if (filter === 'done')    return i.is_done
    return true
  })
  const pending = items.filter(i => !i.is_done)
  const done    = items.filter(i => i.is_done)

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">할 일 관리</h1>
          <p className="text-xs text-slate-400 mt-0.5">정기 점검 · 실험 준비 · 체크리스트</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null) }}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500 transition-colors">
          <Plus className="w-4 h-4" />항목 추가
        </button>
      </div>

      {/* 새 할일 폼 */}
      {showForm && (
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3">새 할 일 추가</p>
          <TodoForm form={form} onChange={setForm} onSubmit={handleCreate}
            onCancel={() => setShowForm(false)} submitLabel="추가" />
        </div>
      )}

      {/* 수정 폼 */}
      {editingId != null && (
        <div className="bg-navy-800 border border-cyan-600/40 rounded-xl p-4">
          <p className="text-xs text-cyan-400 mb-3">할 일 수정</p>
          <TodoForm form={editForm} onChange={setEditForm} onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)} submitLabel="저장" />
        </div>
      )}

      {/* 필터 탭 */}
      <div className="flex gap-1 bg-navy-800 border border-navy-600 rounded-lg p-1">
        {([['all', `전체 (${items.length})`], ['pending', `미완료 (${pending.length})`], ['done', `완료 (${done.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={clsx('flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
              filter === key ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {displayed.length === 0 && (
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-8 text-center text-slate-500 text-sm">
            {filter === 'done' ? '완료된 항목 없음' : '할 일 없음 🎉'}
          </div>
        )}
        {displayed.map(item => {
          const isEditing = editingId === item.id
          if (isEditing) return null
          return (
            <div key={item.id}
              className={clsx('bg-navy-800 border rounded-xl p-4 flex items-start gap-3 transition-opacity',
                PRIORITY_COLORS[item.priority], item.is_done && 'opacity-60')}>
              {/* 체크 버튼 */}
              <button onClick={() => toggleDone(item)}
                className={clsx('mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                  item.is_done
                    ? 'bg-emerald-500 border-emerald-500 hover:opacity-80'
                    : 'border-current text-slate-400 hover:bg-current/20')}>
                {item.is_done && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium', item.is_done ? 'line-through text-slate-400' : 'text-white')}>
                  {item.title}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium', PRIORITY_BADGE[item.priority])}>
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                  {item.schedule_type !== 'once' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-0.5">
                      <Repeat className="w-2.5 h-2.5" />{scheduleSummary(item)}
                    </span>
                  )}
                  {item.schedule_type === 'once' && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />1회
                    </span>
                  )}
                </div>
                {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
                {item.is_done && item.done_date && (
                  <p className="text-[10px] text-slate-600 mt-1">완료: {item.done_date}</p>
                )}
              </div>

              {/* 수정/삭제 버튼 */}
              {!item.is_done && (
                <button onClick={() => startEdit(item)}
                  className="p-1.5 text-slate-500 hover:text-cyan-400 flex-shrink-0 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 flex-shrink-0 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
