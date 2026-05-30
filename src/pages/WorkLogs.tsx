import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { fetchWorkLogs, WorkLog } from '../lib/supabase'
import Spinner from '../components/Spinner'

const STATUS_COLORS: Record<string, string> = {
  완료:  'bg-emerald-500/20 text-emerald-400',
  진행중: 'bg-blue-500/20 text-blue-400',
  대기:  'bg-yellow-500/20 text-yellow-400',
}

function WorkLogRow({ log }: { log: WorkLog }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden transition-all"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-3 p-4">
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
            {log.log_date}
            {log.test_item && ` · ${log.test_item}`}
            {log.sample_count != null && ` · ${log.sample_count}건`}
          </p>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-slate-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </div>

      {open && (
        <div className="border-t border-navy-600 px-4 pb-4 pt-3 space-y-2 text-xs text-slate-300">
          {[
            ['시험항목', log.test_item],
            ['장비', log.equipment_name],
            ['담당자', log.operator],
            ['샘플 수', log.sample_count != null ? `${log.sample_count}건` : null],
            ['소요시간', log.duration_hours != null ? `${log.duration_hours}시간` : null],
            ['메모', log.notes],
          ].map(([label, value]) =>
            value ? (
              <div key={label as string} className="flex gap-2">
                <span className="text-slate-500 w-16 flex-shrink-0">{label}</span>
                <span className="flex-1">{value}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}

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
  const PAGE_SIZE = 20

  const debouncedSearch = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    const p = reset ? 0 : page
    try {
      const { data, count } = await fetchWorkLogs({
        search, from: fromDate, to: toDate, page: p, pageSize: PAGE_SIZE,
      })
      setLogs(prev => reset ? data : [...prev, ...data])
      setTotal(count)
      setHasMore((p + 1) * PAGE_SIZE < count)
      if (reset) setPage(0)
    } finally {
      setLoading(false)
    }
  }, [search, fromDate, toDate, page])

  // 검색어 변경 시 디바운스
  useEffect(() => {
    clearTimeout(debouncedSearch.current)
    debouncedSearch.current = setTimeout(() => {
      setPage(0)
      load(true)
    }, 400)
    return () => clearTimeout(debouncedSearch.current)
  }, [search, fromDate, toDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const next = page + 1
    setPage(next)
    setLoading(true)
    try {
      const { data, count } = await fetchWorkLogs({
        search, from: fromDate, to: toDate, page: next, pageSize: PAGE_SIZE,
      })
      setLogs(prev => [...prev, ...data])
      setTotal(count)
      setHasMore((next + 1) * PAGE_SIZE < count)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 상단 헤더 */}
      <div className="px-4 pt-5 pb-3 bg-navy-900 border-b border-navy-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">업무일지</h1>
            {total > 0 && <p className="text-[11px] text-slate-400">총 {total.toLocaleString()}건</p>}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={clsx(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
              showFilter ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-navy-600 text-slate-400',
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            필터
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="프로젝트명 검색"
            className="w-full bg-navy-700 border border-navy-600 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 날짜 필터 */}
        {showFilter && (
          <div className="flex gap-2 items-center">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-cyan-500" />
            <span className="text-slate-500 text-xs">~</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-cyan-500" />
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate('') }}
                className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {logs.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500 text-sm">
            검색 결과가 없습니다.
          </div>
        )}
        {logs.map((log) => <WorkLogRow key={log.id} log={log} />)}

        {/* 더 보기 버튼 */}
        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="w-full py-3 text-sm text-cyan-400 font-medium border border-navy-600 rounded-xl bg-navy-800 active:bg-navy-700 transition-colors">
            {loading ? <Spinner className="w-4 h-4 mx-auto" /> : '더 보기'}
          </button>
        )}
        {loading && logs.length === 0 && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
      </div>
    </div>
  )
}
