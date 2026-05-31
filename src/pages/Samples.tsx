import { useEffect, useRef, useState } from 'react'
import { Search, X, FlaskConical, Plus, Pencil, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { fetchSamples, fetchSampleTestItems, createSample, updateSample, deleteSample, deleteAllSamples, Sample } from '../lib/supabase'
import Spinner from '../components/Spinner'

// ── 시험항목별 태그 색상 (PC와 동일) ─────────────────────────────────────────
const TEST_ITEM_STYLE: Record<string, string> = {
  '조단백':   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  '비타민 A': 'bg-green-500/15 text-green-400 border-green-500/20',
  '비타민 E': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  '중금속':   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  '무기비소': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'default':  'bg-slate-500/15 text-slate-400 border-slate-500/20',
}
function getTag(ti: string) {
  for (const [k, v] of Object.entries(TEST_ITEM_STYLE)) {
    if (k !== 'default' && ti?.includes(k)) return v
  }
  return TEST_ITEM_STYLE['default']
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
  receipt_date: s.receipt_date ?? '',
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
    setSaving(true); setError('')
    try { await onSave(formToPayload(form)) } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <div className="bg-navy-800 border border-cyan-500/50 rounded-xl p-4 space-y-3 mb-3">
      <h3 className="text-sm font-semibold text-cyan-400">{initial ? '샘플 수정' : '샘플 추가'}</h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">SAMPLE ID</label>
          <input placeholder="T026010..." value={form.sample_id} onChange={set('sample_id')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">접수번호</label>
          <input placeholder="접수번호" value={form.receipt_number} onChange={set('receipt_number')} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">시료명</label>
          <input placeholder="시료명" value={form.sample_name} onChange={set('sample_name')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">시험항목</label>
          <input placeholder="조단백, 중금속..." value={form.test_item} onChange={set('test_item')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">결과값</label>
          <input placeholder="0.00" value={form.result_value} onChange={set('result_value')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">단위</label>
          <input placeholder="%" value={form.unit} onChange={set('unit')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">접수일</label>
          <input type="date" value={form.receipt_date} onChange={set('receipt_date')} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">분析일</label>
          <input type="date" value={form.analysis_date} onChange={set('analysis_date')} className={INPUT} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
          {saving ? '저장 중...' : '저장'}
        </button>
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm font-medium transition-colors">
          취소
        </button>
      </div>
    </div>
  )
}

// ── 전체 삭제 모달 ────────────────────────────────────────────────────────────
function BulkDeleteModal({ total, onClose, onConfirm }: {
  total: number; onClose: () => void; onConfirm: () => void
}) {
  const [confirm, setConfirm] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-navy-800 border border-red-500/40 rounded-2xl w-full max-w-sm p-5 space-y-4"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-red-400">⚠️ 샘플 전체 삭제</h3>
        <p className="text-sm text-slate-300">전체 <span className="text-red-400 font-bold">{total.toLocaleString()}건</span> 삭제</p>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block"><span className="text-red-400 font-medium">삭제</span> 를 입력하세요</label>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="삭제" autoFocus
            className="w-full bg-[#0f172a] border border-red-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-400" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-navy-700 text-slate-300 text-sm font-medium">취소</button>
          <button onClick={onConfirm} disabled={confirm !== '삭제'}
            className="flex-1 py-2.5 rounded-xl bg-red-600 disabled:opacity-40 text-white text-sm font-medium">전체 삭제</button>
        </div>
      </div>
    </div>
  )
}

// ── 테이블 행 ─────────────────────────────────────────────────────────────────
function SampleRow({ s, onEdit, onDelete }: {
  s: Sample; onEdit: (s: Sample) => void; onDelete: (id: number) => void
}) {
  const [delConfirm, setDelConfirm] = useState(false)
  return (
    <tr className={clsx(
      'border-t border-navy-800 hover:bg-navy-800/40 transition-colors',
      s.is_abnormal ? 'bg-red-500/5' : s.is_retest ? 'bg-yellow-500/5' : ''
    )}>
      {/* 접수번호 */}
      <td className="px-3 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">
        {s.sample_id || '-'}
      </td>
      {/* 시료명 */}
      <td className="px-3 py-2 max-w-[150px]">
        <span className="block truncate text-sm text-white font-medium" title={s.sample_name ?? ''}>
          {s.sample_name || '-'}
        </span>
        {s.is_retest && (
          <span className="text-[9px] px-1 py-0 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">재실험</span>
        )}
        {s.is_abnormal && (
          <span className="text-[9px] px-1 py-0 rounded bg-red-500/10 text-red-400 border border-red-500/20 ml-1">
            <AlertTriangle className="inline w-2.5 h-2.5 mr-0.5" />이상
          </span>
        )}
      </td>
      {/* 시험항목 */}
      <td className="px-3 py-2 whitespace-nowrap">
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border font-medium', getTag(s.test_item ?? ''))}>
          {s.test_item || '-'}
        </span>
      </td>
      {/* 결과 */}
      <td className="px-3 py-2 font-mono text-sm text-white whitespace-nowrap">
        {s.result_value ?? '-'}
      </td>
      {/* 기준값 비교 */}
      <td className="px-3 py-2 whitespace-nowrap">
        {s.is_retest && s.result_change ? (
          <span className="text-xs text-yellow-300 font-mono">{s.result_change}</span>
        ) : s.is_retest && s.previous_result_value ? (
          <span className="text-xs text-slate-400 font-mono">기존 {s.previous_result_value}</span>
        ) : (
          <span className="text-slate-700 text-xs">-</span>
        )}
      </td>
      {/* 단위 */}
      <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
        {s.unit || '-'}
      </td>
      {/* 접수일 */}
      <td className="px-3 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">
        {s.receipt_date || '-'}
      </td>
      {/* 분析일 */}
      <td className="px-3 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">
        {s.analysis_date || '-'}
      </td>
      {/* 액션 */}
      <td className="px-2 py-2 whitespace-nowrap">
        {delConfirm ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(s.id)}
              className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white">확인</button>
            <button onClick={() => setDelConfirm(false)}
              className="text-[10px] px-2 py-0.5 rounded bg-navy-600 text-slate-300">취소</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(s)} className="text-slate-400 hover:text-cyan-400 transition-colors" title="수정">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDelConfirm(true)} className="text-slate-400 hover:text-red-400 transition-colors" title="삭제">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function Samples() {
  const [search, setSearch] = useState('')
  const [testItemFilter, setTestItemFilter] = useState('')
  const [retestOnly, setRetestOnly] = useState(false)
  const [abnormalOnly, setAbnormalOnly] = useState(false)
  const [testItems, setTestItems] = useState<{ name: string; count: number }[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [samples, setSamples] = useState<Sample[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Sample | null>(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const PAGE_SIZE = 30
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const loadTestItems = async () => {
    const items = await fetchSampleTestItems()
    setTestItems(items)
    setTotalCount(items.reduce((s, i) => s + i.count, 0))
  }

  const load = async (reset = false, p = 0) => {
    setLoading(true)
    try {
      const { data, count } = await fetchSamples({
        search, page: p, pageSize: PAGE_SIZE,
        test_item: testItemFilter || undefined,
        retest_only: retestOnly || undefined,
        abnormal_only: abnormalOnly || undefined,
      })
      setSamples(prev => reset ? data : [...prev, ...data])
      setHasMore((p + 1) * PAGE_SIZE < count)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadTestItems() }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(0); load(true, 0) }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [search, testItemFilter, retestOnly, abnormalOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const next = page + 1; setPage(next)
    await load(false, next)
  }

  const handleSave = async (payload: Partial<Sample>) => {
    if (editTarget) {
      await updateSample(editTarget.id, payload)
      setSamples(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...payload } as Sample : s))
      setEditTarget(null)
    } else {
      await createSample(payload)
      setShowForm(false)
      await load(true, 0)
      await loadTestItems()
    }
  }

  const handleDelete = async (id: number) => {
    await deleteSample(id)
    setSamples(prev => prev.filter(s => s.id !== id))
    setTotalCount(prev => prev - 1)
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    try {
      await deleteAllSamples()
      setSamples([]); setTotalCount(0); setHasMore(false)
      setTestItems([]); setShowBulkDelete(false)
    } catch (e) { alert('삭제 실패: ' + (e as Error).message) } finally { setDeleting(false) }
  }

  const startEdit = (s: Sample) => {
    setEditTarget(s); setShowForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-full">
      {showBulkDelete && (
        <BulkDeleteModal total={totalCount} onClose={() => setShowBulkDelete(false)} onConfirm={handleBulkDelete} />
      )}

      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 bg-[#0f172a] border-b border-navy-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">샘플 관리</h1>
            <p className="text-[11px] text-slate-400">전체 {totalCount.toLocaleString()}건</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { load(true, 0); loadTestItems() }} title="새로고침"
              className="p-1.5 rounded-lg border border-navy-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            {totalCount > 0 && (
              <button onClick={() => setShowBulkDelete(true)} disabled={deleting} title="전체 삭제"
                className="p-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => { setShowForm(!showForm); setEditTarget(null) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />추가
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="시료명 · 의뢰명 · SAMPLE ID 검색"
            className="w-full bg-navy-700 border border-navy-600 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        </div>

        {/* 시험항목 필터 칩 (PC와 동일) */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => { setTestItemFilter(''); setRetestOnly(false); setAbnormalOnly(false) }}
            className={clsx('shrink-0 text-xs px-3 py-1 rounded-full font-medium border transition-colors whitespace-nowrap',
              !testItemFilter && !retestOnly && !abnormalOnly
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'border-navy-600 text-slate-400 hover:border-slate-500')}>
            전체 {totalCount}
          </button>
          {testItems.map(ti => (
            <button key={ti.name}
              onClick={() => { setTestItemFilter(ti.name); setRetestOnly(false); setAbnormalOnly(false) }}
              className={clsx('shrink-0 text-xs px-3 py-1 rounded-full font-medium border transition-colors whitespace-nowrap',
                testItemFilter === ti.name
                  ? clsx(getTag(ti.name), 'opacity-100')
                  : 'border-navy-600 text-slate-400 hover:border-slate-500')}>
              {ti.name} {ti.count}
            </button>
          ))}
          <button
            onClick={() => { setRetestOnly(true); setAbnormalOnly(false); setTestItemFilter('') }}
            className={clsx('shrink-0 text-xs px-3 py-1 rounded-full font-medium border transition-colors whitespace-nowrap',
              retestOnly
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                : 'border-navy-600 text-slate-400 hover:border-slate-500')}>
            재실험
          </button>
          <button
            onClick={() => { setAbnormalOnly(true); setRetestOnly(false); setTestItemFilter('') }}
            className={clsx('shrink-0 text-xs px-3 py-1 rounded-full font-medium border transition-colors whitespace-nowrap',
              abnormalOnly
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'border-navy-600 text-slate-400 hover:border-slate-500')}>
            이상
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {/* 폼 */}
        {(showForm || editTarget) && (
          <div className="px-4 pt-3">
            <SampleForm
              initial={editTarget ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditTarget(null) }}
            />
          </div>
        )}

        {/* 테이블 */}
        {samples.length === 0 && !loading && !showForm && !editTarget ? (
          <div className="text-center py-16 text-slate-500">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">샘플 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/60 sticky top-0 z-10">
                  {['접수번호', '시료명', '시험항목', '결과', '기준값 비교', '단위', '접수일', '분析일', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-medium text-slate-400 tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {samples.map(s => (
                  <SampleRow key={s.id} s={s} onEdit={startEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 더 보기 */}
        {hasMore && (
          <div className="px-4 py-3">
            <button onClick={loadMore} disabled={loading}
              className="w-full py-3 text-sm text-cyan-400 font-medium border border-navy-600 rounded-xl bg-navy-800 active:bg-navy-700">
              {loading ? <Spinner className="w-4 h-4 mx-auto" /> : '더 보기'}
            </button>
          </div>
        )}
        {loading && samples.length === 0 && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
      </div>
    </div>
  )
}
