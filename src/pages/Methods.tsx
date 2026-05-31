import { useEffect, useState } from 'react'
import { X, Download, FileText, FileSpreadsheet, Image as ImageIcon, File, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { fetchMethods, supabase, ExperimentMethod } from '../lib/supabase'
import Spinner from '../components/Spinner'

// ── 파일 아이콘 ───────────────────────────────────────────────────────────────
const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf:  <FileText className="w-5 h-5 text-red-400" />,
  xlsx: <FileSpreadsheet className="w-5 h-5 text-green-400" />,
  xls:  <FileSpreadsheet className="w-5 h-5 text-green-400" />,
  docx: <FileText className="w-5 h-5 text-blue-400" />,
  doc:  <FileText className="w-5 h-5 text-blue-400" />,
  hwp:  <FileText className="w-5 h-5 text-teal-400" />,
  hwpx: <FileText className="w-5 h-5 text-teal-400" />,
  png:  <ImageIcon className="w-5 h-5 text-purple-400" />,
  jpg:  <ImageIcon className="w-5 h-5 text-purple-400" />,
  jpeg: <ImageIcon className="w-5 h-5 text-purple-400" />,
}
const fileIcon = (t?: string) => (t && FILE_ICONS[t]) ?? <File className="w-5 h-5 text-slate-400" />

const fmt = (b?: number) => {
  if (!b) return ''
  if (b < 1024) return `${b}B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`
  return `${(b / 1048576).toFixed(1)}MB`
}

// ── 뷰어 URL 결정 ─────────────────────────────────────────────────────────────
type ViewKind = 'image' | 'iframe' | null

function resolveViewer(m: ExperimentMethod): { kind: ViewKind; url: string } | null {
  const t = m.file_type?.toLowerCase() ?? ''
  const pub = m.file_url

  if (['png', 'jpg', 'jpeg'].includes(t) && pub) return { kind: 'image', url: pub }
  if (t === 'pdf' && pub)
    return { kind: 'iframe', url: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pub)}` }
  if (['hwp', 'hwpx'].includes(t) && pub)
    return { kind: 'iframe', url: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pub)}` }
  if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(t) && pub)
    return { kind: 'iframe', url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pub)}` }
  return null
}

// ── 뷰어 모달 ────────────────────────────────────────────────────────────────
function ViewerModal({ method, onClose }: { method: ExperimentMethod; onClose: () => void }) {
  const cfg = resolveViewer(method)
  const type = method.file_type?.toLowerCase() ?? ''

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex flex-col bg-navy-900 flex-1 overflow-hidden rounded-t-2xl mt-auto sm:m-4 sm:rounded-2xl sm:flex-none sm:h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700 bg-navy-800 flex-shrink-0">
          <div className="flex-shrink-0">{fileIcon(type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{method.title}</p>
            {method.test_item && (
              <p className="text-[11px] text-slate-400">{method.test_item}</p>
            )}
          </div>
          {method.file_url && (
            <a href={method.file_url} download={method.file_name} target="_blank" rel="noreferrer"
              className="p-2 rounded-lg bg-navy-700 text-slate-300">
              <Download className="w-4 h-4" />
            </a>
          )}
          <button onClick={onClose} className="p-2 rounded-lg bg-navy-700 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 뷰어 본체 */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-950">
          {cfg?.kind === 'image' && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img src={cfg.url} alt={method.title} className="max-w-full max-h-full object-contain rounded" />
            </div>
          )}
          {cfg?.kind === 'iframe' && (
            <iframe key={cfg.url} src={cfg.url} title={method.title}
              className="w-full h-full border-0 bg-white" allow="fullscreen" />
          )}
          {!cfg && (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-slate-400">
              <div className="opacity-40">{fileIcon(type)}</div>
              <p className="text-sm text-center text-white font-medium">{method.file_name || method.title}</p>
              {!method.file_url ? (
                <div className="text-center space-y-2">
                  <p className="text-xs text-slate-400 bg-navy-800 rounded-xl px-4 py-3 leading-relaxed">
                    파일 URL이 없습니다.<br />
                    PC에서 <span className="text-cyan-400 font-mono">upload_methods_to_storage.py</span>를<br />
                    실행하면 모바일에서도 볼 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-xs text-slate-500">이 파일 형식은 브라우저에서 직접 볼 수 없습니다.</p>
                  <a href={method.file_url} download={method.file_name} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    <Download className="w-4 h-4" />다운로드
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function Methods() {
  const [methods, setMethods] = useState<ExperimentMethod[]>([])
  const [testItems, setTestItems] = useState<string[]>([])
  const [filterItem, setFilterItem] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ExperimentMethod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchMethods(filterItem ?? undefined),
      supabase
        .from('experiment_methods')
        .select('test_item')
        .not('test_item', 'is', null),
    ]).then(([m, tiRes]) => {
      setMethods(m)
      const unique = [...new Set((tiRes.data ?? []).map((r: any) => r.test_item as string).filter(Boolean))]
      setTestItems(unique.sort())
    }).finally(() => setLoading(false))
  }, [filterItem])

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 bg-navy-900 border-b border-navy-700 space-y-3">
        <h1 className="text-lg font-bold text-white">실험법 자료</h1>
        {/* 시험항목 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterItem(null)}
            className={clsx('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors',
              filterItem === null ? 'bg-cyan-500 text-white' : 'bg-navy-700 text-slate-400')}
          >전체</button>
          {testItems.map((ti) => (
            <button key={ti}
              onClick={() => setFilterItem(ti === filterItem ? null : ti)}
              className={clsx('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                filterItem === ti ? 'bg-cyan-500 text-white' : 'bg-navy-700 text-slate-400')}
            >{ti}</button>
          ))}
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
        {!loading && methods.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">등록된 실험법 자료가 없습니다.</p>
          </div>
        )}
        {methods.map((m) => {
          const canView = !!resolveViewer(m)
          return (
            <div key={m.id} className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex items-center gap-3">
              <div className="flex-shrink-0">{fileIcon(m.file_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{m.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {m.test_item && (
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">{m.test_item}</span>
                  )}
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{m.file_type}</span>
                  {m.file_size ? <span className="text-[10px] text-slate-500">{fmt(m.file_size)}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* 뷰어 버튼 - URL 있으면 보기, 없으면 클릭해도 모달에서 안내 */}
                <button onClick={() => setViewing(m)}
                  className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium',
                    canView ? 'bg-cyan-600 text-white' : 'bg-navy-700 text-slate-400 border border-navy-600')}>
                  보기
                </button>
                {/* 다운로드 버튼 */}
                {m.file_url && (
                  <a href={m.file_url} download={m.file_name} target="_blank" rel="noreferrer"
                    className="p-1.5 rounded-lg bg-navy-700 text-slate-400 hover:text-white transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {viewing && <ViewerModal method={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
