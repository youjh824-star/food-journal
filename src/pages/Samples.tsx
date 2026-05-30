import { useEffect, useRef, useState } from 'react'
import { Search, X, FlaskConical, Plus, Pencil, Trash2, Save } from 'lucide-react'
import clsx from 'clsx'
import { fetchSamples, createSample, updateSample, deleteSample, Sample } from '../lib/supabase'
import Spinner from '../components/Spinner'

const STATUS_OPTIONS = ['접수', '진행중', '완료', '반려']
const STATUS_COLORS: Record<string, string> = {
  접수: 'bg-blue-500/20 text-blue-400',
  진행중: 'bg-yellow-500/20 text-yellow-400',
  완료: 'bg-emerald-500/20 text-emerald-400',
  반려: 'bg-red-500/20 text-red-400',
}

const INPUT = 'w-full bg-[#0f172a] border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors'

// ── 폼 ───────────────────────────────────────────────────────────────────────
interface FormData {
  sample_id: string; project_name: string; test_item: string; sample_count: string
  receive_date: string; deadline: string; status: string; notes: string
}
const emptyForm = (): FormData => ({
  sample_id: '', project_name: '', test_item: '', sample_count: '',
  receive_date: new Date().toISOString().slice(0, 10), deadline: '',
  status: '접수', notes: '',
})
const sampleToForm = (s: Sample): FormData => ({
  sample_id: s.sample_id ?? '', project_name: s.project_name ?? '',
  test_item: s.test_item ?? '', sample_count: String(s.sample_count ?? ''),
  receive_date: s.receive_date ?? '', deadline: s.deadline ?? '',
  status: s.status ?? '접수', notes: s.notes ?? '',
})
const formToPayload = (f: FormData): Partial<Sample> => ({
  sample_id: f.sample_id || undefined, project_name: f.project_name || undefined,
  test_item: f.test_item || undefined, sample_count: f.sample_count ? Number(f.sample_count) : undefined,
  receive_date: f.receive_date || undefined, deadline: f.deadline || undefined,
  status: f.status || undefined, notes: f.notes || undefined,
})

function SampleForm({ initial, onSave, onCancel }: {
  initial?: Sample; onSave: (d: Partial<Sample>) => Promise<void>; onCancel: () => void
}) {
  const [form, setForm] = useState<FormData>(initial ? sampleToForm(initial) : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const save = async () => {
    if (!form.project_name.trim()) { setError('프로젝트명을 입력하세요.'); return }
    setSaving(true); setError('')
    try { await onSave(formToPayload(form)) } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <div className="bg-navy-800 border border-cyan-500/50 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-cyan-400">{initial ? '샘플 수정' : '샘플 추가'}</h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">프로젝트명 *</label>
          <input placeholder="프로젝트명" value={form.project_name} onChange={set('project_name')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">샘플 ID</label>
          <input placeholder="S-2026-001" value={form.sample_id} onChange={set('sample_id')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">상태</label>
          <select value={form.status} onChange={set('status')} className={INPUT}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">시험항목</label>
          <input placeholder="예: 중금속" value={form.test_item} onChange={set('test_item')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">샘플 수</label>
          <input type="number" placeholder="0" value={form.sample_count} onChange={set('sample_count')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">접수일</label>
          <input type="date" value={form.receive_date} onChange={set('receive_date')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">마감일</label>
          <input type="date" value={form.deadline} onChange={set('deadline')} className={INPUT} />
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
        <button onClick={onCancel} className="px-4 bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm py-2 rounded-lg transition-colors">취소</button>
      </div>
    </div>
  )
}

// ── 카드 ─────────────────────────────────────────────────────────────────────
function SampleCard({ s, onEdit, onDelete }: { s: Sample; onEdit: (s: Sample) => void; onDelete: (id: number) => void }) {
  const [delConfirm, setDelConfirm] = useState(false)
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{s.project_name || '(프로젝트명 없음)'}</p>
          {s.sample_id && <p className="text-[10px] text-slate-500 font-mono">{s.sample_id}</p>}
        </div>
        {s.status && (
          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
            STATUS_COLORS[s.status] ?? 'bg-slate-700 text-slate-300')}>
            {s.status}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        {s.test_item && <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">{s.test_item}</span>}
        {s.sample_count != null && <span>샘플 {s.sample_count}건</span>}
        {s.receive_date && <span>접수 {s.receive_date}</span>}
        {s.deadline && <span className="text-orange-400">마감 {s.deadline}</span>}
      </div>

      {s.notes && <p className="text-[11px] text-slate-400 line-clamp-2">{s.notes}</p>}

      <div className="flex gap-2 pt-1 border-t border-navy-700">
        <button onClick={() => onEdit(s)}
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors">
          <Pencil className="w-3.5 h-3.5" />수정
        </button>
        {delConfirm ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-red-400">삭제하시겠습니까?</span>
            <button onClick={() => onDelete(s.id)} className="text-xs text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded-lg transition-colors">삭제</button>
            <button onClick={() => setDelConfirm(false)} className="text-xs text-slate-400 hover:text-white">취소</button>
          </div>
        ) : (
          <button onClick={() => setDelConfirm(true)}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors ml-auto">
            <Trash2 className="w-3.5 h-3.5" />삭제
          </button>
        )}
      </div>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function Samples() {
  const [search, setSearch] = useState('')
  const [samples, setSamples] = useState<Sample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Sample | null>(null)
  const PAGE_SIZE = 20
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const load = async (reset = false, q = search, p = 0) => {
    setLoading(true)
    try {
      const { data, count } = await fetchSamples({ search: q, page: p, pageSize: PAGE_SIZE })
      setSamples(prev => reset ? data : [...prev, ...data])
      setTotal(count); setHasMore((p + 1) * PAGE_SIZE < count)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(0); load(true, search, 0) }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const next = page + 1; setPage(next); setLoading(true)
    try {
      const { data, count } = await fetchSamples({ search, page: next, pageSize: PAGE_SIZE })
      setSamples(prev => [...prev, ...data]); setTotal(count); setHasMore((next + 1) * PAGE_SIZE < count)
    } finally { setLoading(false) }
  }

  const handleSave = async (payload: Partial<Sample>) => {
    if (editTarget) {
      await updateSample(editTarget.id, payload)
      setSamples(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...payload } as Sample : s))
      setEditTarget(null)
    } else {
      await createSample(payload)
      setShowForm(false)
      await load(true, search, 0)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteSample(id)
    setSamples(prev => prev.filter(s => s.id !== id))
    setTotal(prev => prev - 1)
  }

  const startEdit = (s: Sample) => { setEditTarget(s); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 bg-[#0f172a] border-b border-navy-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">샘플 현황</h1>
            {total > 0 && <p className="text-[11px] text-slate-400">총 {total.toLocaleString()}건</p>}
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditTarget(null) }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />추가
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="프로젝트명 검색"
            className="w-full bg-navy-700 border border-navy-600 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {showForm && !editTarget && <SampleForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
        {editTarget && <SampleForm initial={editTarget} onSave={handleSave} onCancel={() => setEditTarget(null)} />}

        {samples.length === 0 && !loading && !showForm && !editTarget && (
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">샘플 데이터가 없습니다.</p>
          </div>
        )}
        {samples.map(s => <SampleCard key={s.id} s={s} onEdit={startEdit} onDelete={handleDelete} />)}
        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="w-full py-3 text-sm text-cyan-400 font-medium border border-navy-600 rounded-xl bg-navy-800 active:bg-navy-700">
            {loading ? <Spinner className="w-4 h-4 mx-auto" /> : '더 보기'}
          </button>
        )}
        {loading && samples.length === 0 && <div className="flex justify-center py-8"><Spinner /></div>}
      </div>
    </div>
  )
}
