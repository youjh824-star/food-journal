import { useEffect, useRef, useState } from 'react'
import { Search, X, FlaskConical } from 'lucide-react'
import clsx from 'clsx'
import { fetchSamples, Sample } from '../lib/supabase'
import Spinner from '../components/Spinner'

const STATUS_COLORS: Record<string, string> = {
  접수:   'bg-blue-500/20 text-blue-400',
  진행중: 'bg-yellow-500/20 text-yellow-400',
  완료:   'bg-emerald-500/20 text-emerald-400',
  반려:   'bg-red-500/20 text-red-400',
}

function SampleCard({ s }: { s: Sample }) {
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
        {s.test_item && (
          <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">{s.test_item}</span>
        )}
        {s.sample_count != null && <span>샘플 {s.sample_count}건</span>}
        {s.receive_date && <span>접수 {s.receive_date}</span>}
        {s.deadline && <span className="text-orange-400">마감 {s.deadline}</span>}
      </div>

      {s.notes && (
        <p className="text-[11px] text-slate-400 line-clamp-2">{s.notes}</p>
      )}
    </div>
  )
}

export default function Samples() {
  const [search, setSearch] = useState('')
  const [samples, setSamples] = useState<Sample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 20
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const load = async (reset = false, q = search, p = 0) => {
    setLoading(true)
    try {
      const { data, count } = await fetchSamples({ search: q, page: p, pageSize: PAGE_SIZE })
      setSamples(prev => reset ? data : [...prev, ...data])
      setTotal(count)
      setHasMore((p + 1) * PAGE_SIZE < count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0)
      load(true, search, 0)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const next = page + 1
    setPage(next)
    setLoading(true)
    try {
      const { data, count } = await fetchSamples({ search, page: next, pageSize: PAGE_SIZE })
      setSamples(prev => [...prev, ...data])
      setTotal(count)
      setHasMore((next + 1) * PAGE_SIZE < count)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 bg-navy-900 border-b border-navy-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">샘플 현황</h1>
            {total > 0 && <p className="text-[11px] text-slate-400">총 {total.toLocaleString()}건</p>}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="프로젝트명 검색"
            className="w-full bg-navy-700 border border-navy-600 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {samples.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">샘플 데이터가 없습니다.</p>
          </div>
        )}
        {samples.map((s) => <SampleCard key={s.id} s={s} />)}
        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="w-full py-3 text-sm text-cyan-400 font-medium border border-navy-600 rounded-xl bg-navy-800 active:bg-navy-700">
            {loading ? <Spinner className="w-4 h-4 mx-auto" /> : '더 보기'}
          </button>
        )}
        {loading && samples.length === 0 && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
      </div>
    </div>
  )
}
