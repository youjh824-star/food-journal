import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { fetchMonthlyStats, fetchEquipment, Equipment } from '../lib/supabase'
import Spinner from '../components/Spinner'

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6']

function groupByMonth(rows: { log_date: string; sample_count?: number }[]) {
  const map = new Map<string, { month: string; count: number; samples: number }>()
  for (const r of rows) {
    const key = format(startOfMonth(parseISO(r.log_date)), 'yyyy-MM')
    const label = format(startOfMonth(parseISO(r.log_date)), 'M월', { locale: ko })
    const cur = map.get(key) ?? { month: label, count: 0, samples: 0 }
    cur.count += 1
    cur.samples += r.sample_count ?? 0
    map.set(key, cur)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

function groupByEquipment(rows: { log_date: string }[], equipment: Equipment[]) {
  // equipment_name 분포 — rows에 equipment_name이 있으면 좋지만
  // fetchMonthlyStats는 log_date + sample_count만 가져옴
  // 여기서는 equipment 수 표시만 활용
  return equipment.slice(0, 7).map((eq, i) => ({
    name: eq.name,
    value: 1,
    color: COLORS[i % COLORS.length],
  }))
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function Stats() {
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchMonthlyStats(6), fetchEquipment()])
      .then(([rows, eq]) => {
        setMonthlyData(groupByMonth(rows as any))
        setEquipment(eq)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  const equipmentPie = equipment.slice(0, 7).map((eq, i) => ({
    name: eq.name,
    value: 1,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="overflow-y-auto px-4 pt-5 pb-6 space-y-6">
      <h1 className="text-lg font-bold text-white">통계</h1>

      {/* 월별 업무일지 수 */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">월별 업무일지 건수</h2>
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
          {monthlyData.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-6">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243048" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="업무일지" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 월별 샘플 수 */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">월별 샘플 처리 건수</h2>
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
          {monthlyData.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-6">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243048" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="samples" name="샘플 수" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 장비 목록 */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          등록 장비 ({equipment.length}대)
        </h2>
        <div className="space-y-2">
          {equipment.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">장비 데이터가 없습니다.</p>
          ) : (
            equipment.map((eq, i) => (
              <div key={eq.id} className="bg-navy-800 border border-navy-600 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{eq.name}</p>
                  {eq.model && <p className="text-[11px] text-slate-400">{eq.model}</p>}
                </div>
                {eq.equipment_type && (
                  <span className="text-[10px] bg-navy-700 text-slate-300 px-2 py-0.5 rounded-full flex-shrink-0">
                    {eq.equipment_type}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 파이차트: 장비 분포 (보조 시각화) */}
      {equipmentPie.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">장비 분포</h2>
          <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={equipmentPie}
                  cx="50%" cy="45%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {equipmentPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-[11px] text-slate-300">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}
