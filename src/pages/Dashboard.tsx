import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { AlertTriangle, CheckSquare, Clock, Lightbulb, TrendingUp, Plus, Trash2 } from 'lucide-react'
import {
  fetchDashboardFull, DashboardFullData,
  fetchCalendarWorkData, CalendarDayData,
  fetchCalendarEvents, CalendarEvent,
  createCalendarEvent, deleteCalendarEvent, updateCalendarEvent,
  updateTodo,
} from '../lib/supabase'
import { getHoliday } from '../lib/koreanHolidays'
import { EVENT_CATEGORIES, DEFAULT_EVENT_CATEGORY, categoryForEvent, eventClassName, type EventCategoryId } from '../lib/eventCategories'
import StickyNotes from '../components/dashboard/StickyNotes'
import FortuneWidget from '../components/dashboard/FortuneWidget'
import WorkCalendar, { ScheduleEvent } from '../components/dashboard/WorkCalendar'
import clsx from 'clsx'

// ── 작은 카드 ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: string }) {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={clsx('text-2xl font-bold font-mono', accent || 'text-white')}>
        {value}{unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

const TOOLTIP_STYLE = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }
const TICK_STYLE = { fill: '#64748b', fontSize: 11 }

// ── 메인 대시보드 ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<DashboardFullData | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [viewMonth, setViewMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<CalendarEvent[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventCategory, setNewEventCategory] = useState<EventCategoryId>(DEFAULT_EVENT_CATEGORY)
  const [showEventForm, setShowEventForm] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventInfo, setEventInfo] = useState('')
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [editEventTitle, setEditEventTitle] = useState('')
  const [editEventCategory, setEditEventCategory] = useState<EventCategoryId>(DEFAULT_EVENT_CATEGORY)

  const loadCalendar = useCallback(async (month: Date) => {
    const y = month.getFullYear(); const m = month.getMonth()
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const end   = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`
    const [work, events] = await Promise.all([
      fetchCalendarWorkData(start, end).catch(() => []),
      fetchCalendarEvents(start, end).catch(() => []),
    ])
    setCalendarData(work)
    setScheduleEvents(events)
  }, [])

  useEffect(() => { fetchDashboardFull().then(setData).catch(console.error) }, [])
  useEffect(() => { loadCalendar(viewMonth) }, [viewMonth, loadCalendar])

  const toggleTodo = async (id: number, completed: boolean) => {
    await updateTodo(id, { is_done: !completed })
    const updated = await fetchDashboardFull()
    setData(updated)
  }

  const addSchedule = async () => {
    const title = newEventTitle.trim(); if (!title) return
    setSavingEvent(true)
    try {
      const created = await createCalendarEvent({ title, event_date: selectedDate, category: newEventCategory })
      setScheduleEvents(prev => [...prev, { ...created, event_date: String(created.event_date).slice(0, 10) }])
      setNewEventTitle(''); setShowEventForm(false)
      setEventInfo('일정이 저장되었습니다.')
      await loadCalendar(viewMonth)
    } catch (e) {
      setEventInfo('저장 실패: ' + (e as Error).message)
    } finally { setSavingEvent(false) }
  }

  const deleteSchedule = async (id: number) => {
    await deleteCalendarEvent(id).catch(console.error)
    setScheduleEvents(prev => prev.filter(e => e.id !== id))
    await loadCalendar(viewMonth)
  }

  const startEdit = (ev: CalendarEvent) => {
    setEditingEventId(ev.id); setEditEventTitle(ev.title)
    setEditEventCategory((ev.category as EventCategoryId) || DEFAULT_EVENT_CATEGORY)
    setShowEventForm(false)
  }

  const saveEdit = async (ev: CalendarEvent) => {
    const title = editEventTitle.trim(); if (!title) return
    try {
      await updateCalendarEvent(ev.id, { title, category: editEventCategory })
      setScheduleEvents(prev => prev.map(e => e.id === ev.id ? { ...e, title, category: editEventCategory } : e))
    } catch { console.error('update failed') }
    setEditingEventId(null)
  }

  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400">로딩 중...</div>

  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
  const selectedDay = calendarData.find(d => d.date === selectedDate)
  const selectedHoliday = getHoliday(selectedDate)
  const selectedEvents = scheduleEvents.filter(e => String(e.event_date).slice(0, 10) === selectedDate)
  const asScheduleEvents: ScheduleEvent[] = scheduleEvents.map(e => ({ ...e, event_date: String(e.event_date).slice(0, 10), color: e.color ?? '' }))

  return (
    <div className="space-y-5 pb-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-white">대시보드</h2>
        <p className="text-sm text-slate-400 mt-0.5">{todayStr} · Lab Work Log</p>
      </div>

      {/* 상단 3열: 메모 + AI 인사이트 + 운세 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StickyNotes />

        {/* AI 인사이트 */}
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400" /> AI 인사이트
          </h3>
          <div className="space-y-2">
            {(data.insights || []).map((text, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />{text}
              </p>
            ))}
            {(!data.insights || data.insights.length === 0) && (
              <p className="text-sm text-slate-500">데이터가 쌓이면 인사이트가 표시됩니다.</p>
            )}
          </div>
        </div>

        <FortuneWidget />
      </div>

      {/* 중단 3열: 오늘 할 일 + 이상 알림 + 유효기간 임박 시약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 오늘 할 일 */}
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> 오늘 할 일
            </h3>
            <Link to="/todos" className="text-xs text-cyan-400 hover:text-cyan-300">전체 관리 →</Link>
          </div>
          <div className="space-y-2">
            {data.todos.length === 0
              ? <p className="text-sm text-slate-500">오늘 할 일 없음</p>
              : data.todos.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)}
                    className="w-4 h-4 cursor-pointer flex-shrink-0 accent-cyan-500" />
                  <span className={clsx('flex-1 text-slate-200', t.completed && 'line-through text-slate-500')}>{t.title}</span>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    t.priority === 'high' ? 'bg-red-500/20 text-red-400' : t.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                  )}>
                    {t.priority === 'high' ? '높음' : t.priority === 'normal' ? '보통' : '낮음'}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* 이상 알림 */}
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> 이상 알림
          </h3>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {data.anomalies.length === 0
              ? <p className="text-sm text-slate-500">이상 없음</p>
              : data.anomalies.slice(0, 4).map(a => (
                <div key={a.id} className={clsx('text-xs px-2 py-1.5 rounded flex items-start gap-1.5',
                  a.severity === 'error' ? 'bg-red-500/15 text-red-300' : 'bg-yellow-500/15 text-yellow-300'
                )}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{a.description}
                </div>
              ))
            }
          </div>
        </div>

        {/* 유효기간 임박 시약 */}
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> 유효기간 임박 시약
          </h3>
          <div className="space-y-2">
            {data.expiring_reagents.length === 0
              ? <p className="text-sm text-slate-500">임박 시약 없음</p>
              : data.expiring_reagents.map(r => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-200 truncate mr-2">{r.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium shrink-0">{r.expiry_date}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* KPI 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="오늘 분석" value={Math.round(data.kpi.today_workload)} unit="건" accent="text-cyan-400" />
        <StatCard label="이번 주 분석" value={Math.round(data.kpi.week_workload)} unit="건" accent="text-green-400" />
        <StatCard label="이번 달 분석" value={Math.round(data.kpi.month_workload)} unit="건" accent="text-yellow-400" />
        <StatCard label="이슈율" value={`${data.kpi.retest_rate}%`} accent="text-red-400" />
      </div>

      {/* 업무 달력 + 날짜 상세 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <WorkCalendar
            calendarData={calendarData}
            scheduleEvents={asScheduleEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            viewMonth={viewMonth}
            onChangeMonth={setViewMonth}
          />
        </div>

        {/* 날짜 상세 패널 */}
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">{selectedDate} 상세</h3>
            <button onClick={() => setShowEventForm(!showEventForm)}
              className="flex items-center gap-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded-lg transition-colors">
              <Plus className="w-3 h-3" /> 일정 추가
            </button>
          </div>

          {selectedHoliday && (
            <div className={clsx('text-xs px-2 py-1.5 rounded mb-3',
              selectedHoliday.type === 'substitute' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'
            )}>
              🎌 {selectedHoliday.name}{selectedHoliday.type === 'substitute' && ' (대체공휴일)'}
            </div>
          )}

          {eventInfo && <p className="text-xs text-cyan-400 mb-3">{eventInfo}</p>}

          {showEventForm && (
            <div className="space-y-2 mb-3">
              <div className="flex flex-wrap gap-1.5">
                {EVENT_CATEGORIES.map(c => (
                  <button key={c.id} type="button" onClick={() => setNewEventCategory(c.id)}
                    className={clsx('text-xs px-2 py-1 rounded-full border transition-colors',
                      newEventCategory === c.id ? clsx(c.className, 'border-transparent ring-1 ring-white/20') : 'border-navy-600 text-slate-400 hover:border-slate-500'
                    )}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  placeholder="일정 제목" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addSchedule() }}
                  autoFocus disabled={savingEvent} />
                <button onClick={addSchedule} disabled={savingEvent || !newEventTitle.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm px-3 rounded-lg transition-colors">
                  {savingEvent ? '...' : '저장'}
                </button>
              </div>
            </div>
          )}

          {selectedEvents.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs text-slate-500">등록 일정</p>
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-center justify-between bg-[#0f172a] rounded-lg p-2 text-sm gap-2">
                  {editingEventId === ev.id ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {EVENT_CATEGORIES.map(c => (
                          <button key={c.id} type="button" onClick={() => setEditEventCategory(c.id)}
                            className={clsx('text-[10px] px-1.5 py-0.5 rounded-full border',
                              editEventCategory === c.id ? clsx(c.className, 'border-transparent') : 'border-navy-600 text-slate-500'
                            )}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input className="flex-1 bg-navy-900 border border-navy-600 rounded px-2 py-1 text-sm text-white outline-none focus:border-cyan-500"
                          value={editEventTitle} onChange={e => setEditEventTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(ev) }} autoFocus />
                        <button onClick={() => saveEdit(ev)} className="text-green-400 hover:text-green-300 text-xs">저장</button>
                        <button onClick={() => setEditingEventId(null)} className="text-slate-400 text-xs">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium shrink-0', eventClassName(ev))}>
                        {categoryForEvent(ev).label}
                      </span>
                      <span className="text-slate-200 flex-1 truncate">{ev.title}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(ev)} className="text-cyan-400 hover:text-cyan-300 text-xs">수정</button>
                        <button onClick={() => deleteSchedule(ev.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedDay ? (
            <div className="space-y-3">
              <p className="text-sm text-cyan-400 font-mono">총 {selectedDay.total_samples}건 분석</p>
              {selectedDay.items.map((item, i) => (
                <div key={i} className="bg-[#0f172a] rounded-lg p-3 text-sm">
                  <p className="font-medium text-white">{item.test_item}</p>
                  <p className="text-slate-400 mt-1">샘플 {item.sample_count}건 · {item.equipment}</p>
                  {item.project && <p className="text-xs text-slate-500 mt-0.5">{item.project}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">해당 날짜 분석 기록 없음</p>
          )}
        </div>
      </div>

      {/* 차트 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-4">주간 분석량</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.week_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="samples" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-4">시험항목 Top 5</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.top_test_items.length ? data.top_test_items : [{ name: '-', value: 0 }]} layout="vertical">
              <XAxis type="number" tick={TICK_STYLE} />
              <YAxis type="category" dataKey="name" tick={TICK_STYLE} width={90} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
