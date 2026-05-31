import { useEffect, useState } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { format, parseISO, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { fetchDetailedStats, fetchSampleStats, fetchEquipment, Equipment } from '../lib/supabase'
import Spinner from '../components/Spinner'

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#f97316']

const TooltipStyle = { backgroundColor: '#1a2438', border: '1px solid #243048', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }
const tick = { fill: '#94a3b8', fontSize: 11 }

type Row = { log_date: string; sample_count?: number; workload?: number; equipment_name?: string; test_item?: string; project_name?: string }

// sample_count 또는 workload 값 추출 (없으면 1)
function rowValue(r: Row): number {
  return r.sample_count ?? r.workload ?? 1
}

function groupByDay(rows: Row[], days = 30) {
  const map = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const r of rows) {
    map.set(r.log_date, (map.get(r.log_date) ?? 0) + rowValue(r))
  }
  return [...map.entries()].map(([date, value]) => ({
    name: format(parseISO(date), 'M/d'), value,
  }))
}

function groupByWeek(rows: Row[]) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const w = format(startOfWeek(parseISO(r.log_date), { locale: ko }), 'M/d', { locale: ko })
    map.set(w, (map.get(w) ?? 0) + rowValue(r))
  }
  return [...map.entries()].slice(-8).map(([name, value]) => ({ name, value }))
}

function groupByField(rows: Row[], field: keyof Row, top = 8) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const key = (r[field] as string) || '기타'
    map.set(key, (map.get(key) ?? 0) + rowValue(r))
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, value]) => ({ name, value }))
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      {children}
    </div>
  )
}

type SampleStats = { byEquipment: {name:string;value:number}[]; byTestItem: {name:string;value:number}[]; byProject: {name:string;value:number}[]; total: number }

export default function StatsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [sampleStats, setSampleStats] = useState<SampleStats | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<30 | 90>(30)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchDetailedStats(period), fetchSampleStats(period), fetchEquipment()])
      .then(([r, ss, eq]) => { setRows(r); setSampleStats(ss); setEquipment(eq) })
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  const daily = groupByDay(rows, period)
  const weekly = groupByWeek(rows)
  // 장비별/시험항목별/프로젝트별은 샘플 기반 정확한 집계 사용
  const byEquipment = sampleStats?.byEquipment ?? groupByField(rows, 'equipment_name')
  const byTestItem = sampleStats?.byTestItem ?? groupByField(rows, 'test_item')
  const byProject = sampleStats?.byProject ?? groupByField(rows, 'project_name')

  const coloredBar = (data: { name: string; value: number }[], radius: [number, number, number, number] = [4, 4, 0, 0]) =>
    <Bar dataKey="value" name="건수" radius={radius} minPointSize={4} fill={COLORS[0]}>
      {data.map((entry, i) => (
        <Cell key={`${entry.name}-${i}`} fill={COLORS[i % COLORS.length]} />
      ))}
    </Bar>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">업무 통계</h1>
          <p className="text-xs text-slate-400 mt-0.5">일간/주간/장비별 업무량 분석</p>
        </div>
        <div className="flex gap-1 bg-navy-800 border border-navy-600 rounded-lg p-1">
          {([30, 90] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === p ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {p}일
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`일간 업무량 (최근 ${period}일)`}>
          {daily.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243048" />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} interval={Math.floor(daily.length / 6)} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TooltipStyle} />
                <Line type="monotone" dataKey="value" name="업무일지" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 text-sm py-6">데이터 없음</p>}
        </Card>

        <Card title="주간 업무량">
          {weekly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243048" />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TooltipStyle} />
                {coloredBar(weekly)}
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 text-sm py-6">데이터 없음</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="장비별 업무량">
          {byEquipment.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byEquipment} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={tick} width={72} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TooltipStyle} />
                {coloredBar(byEquipment, [0, 4, 4, 0])}
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 text-sm py-6">데이터 없음</p>}
        </Card>

        <Card title="시험항목별">
          {byTestItem.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byTestItem} margin={{ top: 4, right: 4, left: -28, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243048" />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={48} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TooltipStyle} />
                {coloredBar(byTestItem)}
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 text-sm py-6">데이터 없음</p>}
        </Card>

        <Card title="프로젝트별">
          {byProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byProject} margin={{ top: 4, right: 4, left: -28, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243048" />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={48} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TooltipStyle} />
                {coloredBar(byProject)}
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 text-sm py-6">데이터 없음</p>}
        </Card>
      </div>

      {/* 장비 목록 */}
      {equipment.length > 0 && (
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">등록 장비 ({equipment.length}대)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {equipment.map((eq, i) => (
              <div key={eq.id} className="flex items-center gap-2.5 bg-navy-700/50 rounded-lg px-3 py-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{eq.name}</p>
                  {eq.model && <p className="text-[10px] text-slate-400">{eq.model}</p>}
                </div>
                {eq.equipment_type && <span className="ml-auto text-[10px] bg-navy-600 text-slate-300 px-2 py-0.5 rounded-full flex-shrink-0">{eq.equipment_type}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
