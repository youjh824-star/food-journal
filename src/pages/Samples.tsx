import { useEffect, useRef, useState } from 'react'
import { Search, X, FlaskConical, Plus, Pencil, Trash2, Save, ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { fetchSamples, createSample, updateSample, deleteSample, Sample } from '../lib/supabase'
import Spinner from '../components/Spinner'

const STATUS_OPTIONS = ['접수', '진행중', '완료', '반려']
const STATUS_COLORS: Record<string, string> = {
  접수:   'bg-blue-500/20 text-blue-400',
  진행중: 'bg-yellow-500/20 text-yellow-400',
  완료:   'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  반려:   'bg-red-500/20 text-red-400',
}

const INPUT = 'w-full bg-[#0f172a] border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors'

// ── 폼 ───────────────────────────────────────────────────────────────────────
interface FormData {
  sample_id: string; sample_name: string; project_name: string; test_item: string
  result_value: string; unit: string; receipt_date: string; analysis_date: string
  receipt_number: string; batch_info: string; status: string
}
const emptyForm = (): FormData => ({
  sample_id: '', sample_name: '', project_name: '', test_item: '',
  result_value: '', unit: '', receipt_date: new Date().toISOString().slice(0, 10),
  analysis_date: '', receipt_number: '', batch_info: '', status: '접수',
})
const sampleToForm = (s: Sample): FormData => ({
  sample_id: s.sample_id ?? '', sample_name: s.sample_name ?? '',
  project_name: s.project_name ?? '', test_item: s.test_item ?? '',
  result_value: s.result_value ?? '', unit: s.unit ?? '',
  receipt_date: s.receipt_date ?? s.receive_date ?? '',
  analysis_date: s.analysis_date ?? '',
  receipt_number: s.receipt_number ?? '', batch_info: s.batch_info ?? '',
  status: s.status ?? '접수',
})
const formToPayload = (f: FormData): Partial<Sample> => ({
  sample_id: f.sample_id || undefined, sample_name: f.sample_name || undefined,
  project_name: f.project_name || undefined, test_item: f.test_item || undefined,
  result_value: f.result_value || undefined, unit: f.unit || undefined,
  receipt_date: f.receipt_date || undefined, analysis_date: f.analysis_date || undefined,
  receipt_number: f.receipt_number || undefined, batch_info: f.batch_info || undefined,
  status: f.status || undefined,
})

function SampleForm({ initial, onSave, onCancel }: {
  initial?: Sample; onSave: (d: Partial<Sample>) => Promise<void>; onCancel: () => void
}) {
  const [form, setForm] = useState<FormData>(initial ? sampleToForm(initial) : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const save = async () => {
    if (!form.project_name.trim()) { setError('프로젝트명(의뢰명)을 입력하세요.'); return }
    setSaving(true); setError('')
    try { await onSave(formToPayload(form)) } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <div className="bg-navy-800 border border-cyan-500/50 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-cyan-400">{initial ? '샘플 수정' : '샘플 추가'}</h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">의뢰명(프로젝트명) *</label>
          <input placeholder="의뢰명" value={form.project_name} onChange={set('project_name')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">SAMPLE ID</label>
          <input placeholder="T026010..." value={form.sample_id} onChange={set('sample_id')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">접수번호</label>
          <input placeholder="A268521-..." value={form.receipt_number} onChange={set('receipt_number')} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">시료명</label>
          <input placeholder="시료명" value={form.sample_name} onChange={set('sample_name')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">시험항목</label>
          <input placeholder="예: 조단백" value={form.test_item} onChange={set('test_item')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">상태</label>
          <select value={form.status} onChange={set('status')} className={INPUT}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">결과값</label>
          <input placeholder="0.0" value={form.result_value} onChange={set('result_value')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">단위</label>
          <input placeholder="g/100g" value={form.unit} onChange={set('unit')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">접수일</label>
          <input type="date" value={form.receipt_date} onChange={set('receipt_date')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">분석일</label>
          <input type="date" value={form.analysis_date} onChange={set('analysis_date')} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">배치/Batch</label>
          <input placeholder="배치 정보" value={form.batch_info} onChange={set('batch_info')} className={INPUT} />
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

// ── 샘플 카드 (PC와 동일한 전체 필드 표시) ──────────────────────────────────
function SampleCard({ s, onEdit, onDelete }: {
  s: Sample; onEdit: (s: Sample) => void; onDelete: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)

  const statusKey = s.status === 'completed' ? '완료' : s.status ?? ''
  const statusLabel = s.status === 'completed' ? '완료' : s.status ?? ''

  return (
    <div className={clsx('bg-navy-800 border rounded-xl overflow-hidden transition-all',
      s.is_abnormal ? 'border-red-500/50' : s.is_retest ? 'border-yellow-500/30' : 'border-navy-600')}>

      {/* 요약 헤더 */}
      <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          {/* SAMPLE ID + 접수번호 */}
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {s.sample_id && (
              <span className="text-[10px] font-mono text-slate-400 bg-navy-700 px-1.5 py-0.5 rounded">
                {s.sample_id}
              </span>
            )}
            {s.receipt_number && (
              <span className="text-[10px] font-mono text-slate-500">
                {s.receipt_number}
              </span>
            )}
            {s.is_retest && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">재실험</span>
            )}
            {s.is_abnormal && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />이상
              </span>
            )}
          </div>

          {/* 시료명 */}
          <p className="font-medium text-white text-sm leading-tight">
            {s.sample_name || s.project_name || '(시료명 없음)'}
          </p>

          {/* 의뢰명 + 시험항목 */}
          <p className="text-[11px] text-slate-400 mt-0.5">
            {s.project_name && <span className="text-cyan-400/80">{s.project_name}</span>}
            {s.project_name && s.test_item && <span className="mx-1">·</span>}
            {s.test_item && <span>{s.test_item}</span>}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* 결과값 */}
          {s.result_value && (
            <p className={clsx('text-sm font-mono font-bold', s.is_abnormal ? 'text-red-400' : 'text-green-400')}>
              {s.result_value}{s.unit && <span className="text-xs text-slate-400 ml-0.5">{s.unit}</span>}
            </p>
          )}
          {/* 상태 */}
          {s.status && (
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium',
              STATUS_COLORS[statusKey] ?? STATUS_COLORS[s.status] ?? 'bg-slate-700 text-slate-300')}>
              {statusLabel}
            </span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 mt-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 mt-1" />}
        </div>
      </div>

      {/* 상세 펼침 */}
      {open && (
        <div className="border-t border-navy-600 px-3 pb-3 pt-2.5 space-y-2.5">
          {/* 날짜 정보 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {([
              ['접수일', s.receipt_date || s.receive_date],
              ['분석일', s.analysis_date],
              ['배치', s.batch_info],
              ['파일', s.source_file ? s.source_file.split('/').pop() : null],
            ] as [string, string | null | undefined][]).map(([label, value]) =>
              value ? (
                <div key={label} className="flex gap-1.5">
                  <span className="text-slate-500 w-12 shrink-0">{label}</span>
                  <span className="text-slate-300 truncate">{value}</span>
                </div>
              ) : null
            )}
          </div>

          {/* 이상 사유 */}
          {s.abnormal_reason && (
            <div className="text-xs bg-red-500/10 text-red-300 rounded-lg px-2.5 py-2">
              <span className="font-medium">이상 사유: </span>{s.abnormal_reason}
            </div>
          )}

          {/* 재실험 비교 */}
          {s.is_retest && s.previous_result_value && (
            <div className="text-xs bg-yellow-500/10 text-yellow-300 rounded-lg px-2.5 py-2 space-y-0.5">
              <div><span className="text-slate-400">이전 결과: </span>{s.previous_result_value} {s.unit}</div>
              {s.result_change && <div><span className="text-slate-400">변화: </span>{s.result_change}</div>}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-1 border-t border-navy-700">
            <button onClick={() => onEdit(s)}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />수정
            </button>
            {delConfirm ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-red-400">삭제하시겠습니까?</span>
                <button onClick={() => onDelete(s.id)} className="text-xs text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded-lg">삭제</button>
                <button onClick={() => setDelConfirm(false)} className="text-xs text-slate-400">취소</button>
              </div>
            ) : (
              <button onClick={() => setDelConfirm(true)}
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

// ── 필터 탭 ──────────────────────────────────────────────────────────────────
type FilterTab = 'all' | 'retest' | 'abnormal'

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function Samples() {
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [samples, setSamples] = useState<Sample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Sample | null>(null)
  const PAGE_SIZE = 30
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

  // 탭 필터
  const filtered = filterTab === 'retest' ? samples.filter(s => s.is_retest)
    : filterTab === 'abnormal' ? samples.filter(s => s.is_abnormal)
    : samples

  const retestCount = samples.filter(s => s.is_retest).length
  const abnormalCount = samples.filter(s => s.is_abnormal).length

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 bg-[#0f172a] border-b border-navy-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">샘플 관리</h1>
            <p className="text-[11px] text-slate-400">
              전체 {total.toLocaleString()}건
              {retestCount > 0 && <span className="text-yellow-400 ml-2">재실험 {retestCount}</span>}
              {abnormalCount > 0 && <span className="text-red-400 ml-2">이상 {abnormalCount}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load(true, search, 0)} title="새로고침"
              className="p-1.5 rounded-lg border border-navy-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowForm(!showForm); setEditTarget(null) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />추가
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="시료명 · 의뢰명 · SAMPLE ID 검색"
            className="w-full bg-navy-700 border border-navy-600 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2">
          {([
            { key: 'all', label: `전체 ${total}` },
            { key: 'retest', label: `재실험 ${retestCount}` },
            { key: 'abnormal', label: `이상 ${abnormalCount}` },
          ] as { key: FilterTab; label: string }[]).map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className={clsx('text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                filterTab === tab.key
                  ? tab.key === 'abnormal' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : tab.key === 'retest' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'border border-navy-600 text-slate-400 hover:border-slate-500'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {showForm && !editTarget && <SampleForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
        {editTarget && <SampleForm initial={editTarget} onSave={handleSave} onCancel={() => setEditTarget(null)} />}

        {filtered.length === 0 && !loading && !showForm && !editTarget && (
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">샘플 데이터가 없습니다.</p>
          </div>
        )}
        {filtered.map(s => <SampleCard key={s.id} s={s} onEdit={startEdit} onDelete={handleDelete} />)}
        {hasMore && filterTab === 'all' && (
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
