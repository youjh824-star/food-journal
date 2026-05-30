import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ClipboardList, FlaskConical, BookOpen, ChevronRight,
  TrendingUp, Calendar, Activity,
} from 'lucide-react'
import clsx from 'clsx'
import {
  fetchDashboardStats, fetchRecentWorkLogs,
  WorkLog,
} from '../lib/supabase'
import Spinner from '../components/Spinner'

interface Stats {
  todayCount: number
  weekCount: number
  weekSamples: number
  monthSamples: number
  equipmentTotal: number
}

function StatCard({
  label, value, unit, icon: Icon, color,
}: {
  label: string; value: number | string; unit?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-navy-800 rounded-2xl p-4 flex flex-col gap-2 border border-navy-600">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">
          {value}
          {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

function WorkLogCard({ log }: { log: WorkLog }) {
  const statusColor: Record<string, string> = {
    완료: 'bg-emerald-500/20 text-emerald-400',
    진행중: 'bg-blue-500/20 text-blue-400',
    대기: 'bg-yellow-500/20 text-yellow-400',
  }
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-white text-sm leading-tight flex-1">{log.project_name}</p>
        {log.status && (
          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium',
            statusColor[log.status] ?? 'bg-slate-700 text-slate-300')}>
            {log.status}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        {log.test_item && <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">{log.test_item}</span>}
        {log.sample_count != null && <span>{log.sample_count}건</span>}
        {log.equipment_name && <span>{log.equipment_name}</span>}
      </div>
      <p className="text-[10px] text-slate-500">
        {log.log_date} {log.operator && `· ${log.operator}`}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '좋은 아침입니다 ☀️' : hour < 18 ? '안녕하세요 👋' : '수고 많으셨습니다 🌙'

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchRecentWorkLogs(5)])
      .then(([s, r]) => { setStats(s); setRecent(r) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      {/* 헤더 */}
      <div>
        <p className="text-xs text-slate-400">{today}</p>
        <h1 className="text-xl font-bold text-white mt-0.5">{greeting}</h1>
        <p className="text-sm text-slate-400">분석실 업무 현황</p>
      </div>

      {/* 통계 카드 */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="오늘 업무일지" value={stats?.todayCount ?? 0} unit="건"
            icon={Calendar} color="bg-cyan-500/20" />
          <StatCard label="이번 주 업무" value={stats?.weekCount ?? 0} unit="건"
            icon={ClipboardList} color="bg-violet-500/20" />
          <StatCard label="이번 주 샘플" value={stats?.weekSamples ?? 0} unit="건"
            icon={FlaskConical} color="bg-emerald-500/20" />
          <StatCard label="이번 달 샘플" value={stats?.monthSamples ?? 0} unit="건"
            icon={TrendingUp} color="bg-orange-500/20" />
        </div>
      )}

      {/* 빠른 이동 */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">바로가기</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: '/worklogs', icon: ClipboardList, label: '업무일지', color: 'text-cyan-400' },
            { to: '/samples',  icon: FlaskConical,  label: '샘플현황', color: 'text-emerald-400' },
            { to: '/methods',  icon: BookOpen,       label: '실험법',   color: 'text-violet-400' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}
              className="bg-navy-800 border border-navy-600 rounded-xl p-3 flex flex-col items-center gap-1.5 active:bg-navy-700 transition-colors">
              <Icon className={clsx('w-5 h-5', color)} />
              <span className="text-[11px] text-slate-300">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 최근 업무일지 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">최근 업무일지</h2>
          <Link to="/worklogs" className="flex items-center text-xs text-cyan-400">
            전체 보기 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((log) => <WorkLogCard key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  )
}
