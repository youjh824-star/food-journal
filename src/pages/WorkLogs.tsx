import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown, Plus, Pencil, Trash2, Save, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { fetchWorkLogs, createWorkLog, updateWorkLog, deleteWorkLog, WorkLog } from '../lib/supabase'
import Spinner from '../components/Spinner'

const STATUS_OPTIONS = ['완료', '진행중', '대기']
const STATUS_COLORS: Record<string, string> = {
  완료: 'bg-emerald-500/20 text-emerald-400',
  진행중: 'bg-blue-500/20 text-blue-400',
  대기: 'bg-yellow-500/20 text-yellow-400',
}

const INPUT = 'w-full bg-[#0f172a] border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors'

// ── 폼 (추가 / 수정 공용) ────────────────────────────────────────────────────
interface FormData {
  log_date: string; project_name: string; test_item: string; sample_count: string
  workload: string; equipment_name: string; duration_hours: string; operator: string
  status: string; notes: string
}
const emptyForm = (): FormData => ({
  log_date: new Date().toISOString().slice(0, 10), project_name: '', test_item: '',
  sample_count: '', workload: '', equipment_name: '', duration_hours: '',
  operator: '', status: '완료', notes: '',
})
const logToForm = (l: WorkLog): FormData => ({
  log_date: l.log_date ?? '', project_name: l.project_name ?? '',
  test_item: l.test_item ?? '', sample_count: String(l.sample_count ?? ''),
  workload: String(l.workload ?? ''), equipment_name: l.equipment_name ?? '',
  duration_hours: String(l.duration_hours ?? ''), operator: l.operator ?? '',
  status: l.status ?? '완료', notes: l.notes ?? '',
})
const formToPayload = (f: FormData): Partial<WorkLog> => ({
  log_date: f.log_date, project_name: f.project_name, test_item: f.test_item || undefined,
  sample_count: f.sample_count ? Number(f.sample_count) : undefined,
  workload: f.workload ? Number(f.workload) : undefined,
  equipment_name: f.equipment_name || undefined, duration_hours: f.duration_hours ? Number(f.duration_hours) : undefined,
  operator: f.operator || undefined, status: f.status || undefined, notes: f.notes || undefined,
})

function WorkLogForm({ initial, onSave, onCancel }: {
  initial?: WorkLog; onSave: (data: Partial<WorkLog>) => Promise<void>; onCancel: () => void
}) {
  const [form, setForm] = useState<FormData>(initial ? logToForm(initial) : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const save = async () => {
    if (!form.project_name.trim()) { setError('프로젝트명을 입력하세요.'); return }
    if (!form.log_date) { setError('날짜를 입력하세요.'); return }
    setSaving(true); setError('')
    try { await onSave(formToPayload(form)) } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <div className="bg-navy-800 border border-cyan-500/50 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-cyan-400">{initial ? '업무일지 수정' : '업무일지 추가'}</h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">날짜 *</label>
          <input type="date" value={form.log_date} onChange={set('log_date')} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">프로젝트명 *</label>
          <input placeholder="프로젝트명" value={form.project_name} onChange={set('project_name')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">시험항목</label>
          <input placeholder="예: 중금속" value={form.test_item} onChange={set('test_item')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">상태</label>
          <select value={form.status} onChange={set('status')} className={INPUT}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">샘플 수</label>
          <input type="number" placeholder="0" value={form.sample_count} onChange={set('sample_count')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">업무량</label>
          <input type="number" placeholder="0" value={form.workload} onChange={set('workload')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">장비명</label>
          <input placeholder="예: ICP-MS" value={form.equipment_name} onChange={set('equipment_name')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">소요시간(h)</label>
          <input type="number" step="0.5" placeholder="0" value={form.duration_hours} onChange={set('duration_hours')} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">담당자</label>
          <input placeholder="담당자명" value={form.operator} onChange={set('operator')} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">메모</label>
          <textarea rows={2} placeholder="메모 내용" value={form.notes} onChange={set('notes')} className={INPUT + ' resize-none'} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm py-2 rounded-lg font-medium transition-colors">
          <Save className="w-4 h-4" />{saving ? '저장 중...' : '저장'}
        </button>
        <button onClick={onCancel}
          className="px-4 bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm py-2 rounded-lg transition-colors">
          취소
        </button>
      </div>
    </div>
  )
}

// ── 행 카드 ─────────────────────────────────────────────────────────────────
function WorkLogRow({ log, onEdit, onDelete }: { log: WorkLog; onEdit: (l: WorkLog) => void; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-white text-sm truncate max-w-[160px]">{log.project_name}</p>
            {log.status && (
              <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                STATUS_COLORS[log.status] ?? 'bg-slate-700 text-slate-300')}>
                {log.status}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {log.log_date}{log.test_item && ` · ${log.test_item}`}{log.sample_count != null && ` · ${log.sample_count}건`}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </div>

      {open && (
        <div className="border-t border-navy-600 px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-2 text-xs text-slate-300">
            {([['시험항목', log.test_item], ['장비', log.equipment_name], ['담당자', log.operator],
               ['샘플 수', log.sample_count != null ? `${log.sample_count}건` : null],
               ['업무량', log.workload != null ? `${log.workload}` : null],
               ['소요시간', log.duration_hours != null ? `${log.duration_hours}시간` : null],
               ['메모', log.notes]] as [string, string | null | undefined][]).map(([label, value]) =>
              value ? (
                <div key={label} className="flex gap-2">
                  <span className="text-slate-500 w-16 flex-shrink-0">{label}</span>
                  <span className="flex-1 whitespace-pre-wrap">{value}</span>
                </div>
              ) : null
            )}
          </div>
          <div className="flex gap-2 pt-1 border-t border-navy-700">
            <button onClick={(e) => { e.stopPropagation(); onEdit(log) }}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />수정
            </button>
            {delConfirm ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-red-400">삭제하시겠습니까?</span>
                <button onClick={(e) => { e.stopPropagation(); onDelete(log.id) }}
                  className="text-xs text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded-lg transition-colors">삭제</button>
                <button onClick={(e) => { e.stopPropagation(); setDelConfirm(false) }}
                  className="text-xs text-slate-400 hover:text-white">취소</button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setDelConfirm(true) }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors ml-auto">
                <Trash2 className="w-3.5 h-3.5" />삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function WorkLogs() {
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<WorkLog | null>(null)
  const PAGE_SIZE = 20
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    const p = reset ? 0 : page
    try {
      const { data, count } = await fetchWorkLogs({ search, from: fromDate, to: toDate, page: p, pageSize: PAGE_SIZE })
      setLogs(prev => reset ? data : [...prev, ...data])
      setTotal(count)
      setHasMore((p + 1) * PAGE_SIZE < count)
      if (reset) setPage(0)
    } finally { setLoading(false) }
  }, [search, fromDate, toDate, page])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(0); load(true) }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [search, fromDate, toDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const next = page + 1; setPage(next); setLoading(true)
    try {
      const { data, count } = await fetchWorkLogs({ search, from: fromDate, to: toDate, page: next, pageSize: PAGE_SIZE })
      setLogs(prev => [...prev, ...data]); setTotal(count); setHasMore((next + 1) * PAGE_SIZE < count)
    } finally { setLoading(false) }
  }

  const handleSave = async (payload: Partial<WorkLog>) => {
    if (editTarget) {
      await updateWorkLog(editTarget.id, payload)
      setLogs(prev => prev.map(l => l.id === editTarget.id ? { ...l, ...payload } as WorkLog : l))
      setEditTarget(null)
    } else {
      await createWorkLog(payload)
      setShowForm(false)
      await load(true)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteWorkLog(id)
    setLogs(prev => prev.filter(l => l.id !== id))
    setTotal(prev => prev - 1)
  }

  const startEdit = (log: WorkLog) => { setEditTarget(log); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 bg-[#0f172a] border-b border-navy-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">업무일지</h1>
            {total > 0 && <p className="text-[11px] text-slate-400">총 {total.toLocaleString()}건</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilter(!showFilter)}
              className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
                showFilter ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-navy-600 text-slate-400')}>
              <SlidersHorizontal className="w-3.5 h-3.5" />필터
            </button>
            <button onClick={() => { setShowForm(!showForm); setEditTarget(null) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />추가
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="프로젝트명 검색"
            className="w-full bg-navy-700 border border-navy-600 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        </div>

        {showFilter && (
          <div className="flex gap-2 items-center">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-cyan-500" />
            <span className="text-slate-500 text-xs">~</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-cyan-500" />
            {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate('') }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
        )}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {/* 추가 폼 */}
        {showForm && !editTarget && (
          <WorkLogForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        )}
        {/* 수정 폼 */}
        {editTarget && (
          <WorkLogForm initial={editTarget} onSave={handleSave} onCancel={() => setEditTarget(null)} />
        )}

        {logs.length === 0 && !loading && !showForm && !editTarget && (
          <div className="text-center py-12 text-slate-500 text-sm">검색 결과가 없습니다.</div>
        )}
        {logs.map(log => (
          <WorkLogRow key={log.id} log={log} onEdit={startEdit} onDelete={handleDelete} />
        ))}
        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="w-full py-3 text-sm text-cyan-400 font-medium border border-navy-600 rounded-xl bg-navy-800 active:bg-navy-700 transition-colors">
            {loading ? <Spinner className="w-4 h-4 mx-auto" /> : '더 보기'}
          </button>
        )}
        {loading && logs.length === 0 && <div className="flex justify-center py-8"><Spinner /></div>}
      </div>
    </div>
  )
}
