import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { getHoliday, isRedDay } from '../../lib/koreanHolidays'
import { EVENT_CATEGORIES, categoryForEvent, eventClassName } from '../../lib/eventCategories'

export interface CalendarDay {
  date: string
  items: { test_item: string; sample_count: number; project: string; equipment: string }[]
  total_samples: number
}
export interface ScheduleEvent {
  id: number; title: string; event_date: string; description?: string; category?: string; color?: string
}

const TAG_COLORS = ['bg-cyan-500/80 text-white','bg-purple-500/80 text-white','bg-yellow-500/80 text-yellow-950','bg-green-500/80 text-white','bg-orange-500/80 text-white','bg-pink-500/80 text-white','bg-blue-500/80 text-white']
function colorForItem(name: string) {
  let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

interface Props {
  calendarData: CalendarDay[]; scheduleEvents: ScheduleEvent[]
  selectedDate: string; onSelectDate: (d: string) => void
  viewMonth: Date; onChangeMonth: (d: Date) => void
}

export default function WorkCalendar({ calendarData, scheduleEvents, selectedDate, onSelectDate, viewMonth, onChangeMonth }: Props) {
  const dataMap = useMemo(() => { const m: Record<string, CalendarDay> = {}; calendarData.forEach(d => { m[d.date] = d }); return m }, [calendarData])
  const eventsMap = useMemo(() => { const m: Record<string, ScheduleEvent[]> = {}; scheduleEvents.forEach(e => { if (!m[e.event_date]) m[e.event_date] = []; m[e.event_date].push(e) }); return m }, [scheduleEvents])

  const year = viewMonth.getFullYear(); const month = viewMonth.getMonth()
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const allItems = new Set<string>(); calendarData.forEach(d => d.items.forEach(i => allItems.add(i.test_item)))

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" /> 업무 달력
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => onChangeMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-navy-700 text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-white min-w-[100px] text-center">{year}년 {month + 1}월</span>
          <button onClick={() => onChangeMonth(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-navy-700 text-slate-400"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-navy-600 rounded-lg overflow-hidden border border-navy-600">
        {['일','월','화','수','목','금','토'].map((d, i) => (
          <div key={d} className={clsx('bg-[#0f172a] text-center text-xs py-2 font-medium', i===0?'text-red-400':i===6?'text-blue-400':'text-slate-500')}>{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} className="bg-[#0f172a] min-h-[72px]" />
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const dayData = dataMap[dateStr]; const dayEvents = eventsMap[dateStr] || []
          const holiday = getHoliday(dateStr); const isToday = dateStr === today; const isSelected = dateStr === selectedDate
          const redDay = isRedDay(dateStr); const dow = new Date(dateStr+'T12:00:00').getDay()
          return (
            <button key={dateStr} onClick={() => onSelectDate(dateStr)}
              className={clsx('bg-[#0f172a] min-h-[72px] p-1 text-left transition-colors hover:bg-navy-700/80', isSelected&&'ring-2 ring-cyan-500 ring-inset', isToday&&!isSelected&&'bg-navy-700/50')}>
              <div className="flex items-start justify-between gap-0.5">
                <span className={clsx('text-xs font-mono leading-none', isToday?'text-cyan-400 font-bold':redDay||dow===0?'text-red-400':dow===6?'text-blue-400':'text-slate-400')}>
                  {day}
                </span>
                {holiday && <span className={clsx('text-[8px] px-0.5 rounded leading-tight truncate max-w-[48px]', holiday.type==='substitute'?'bg-orange-500/30 text-orange-300':'bg-red-500/30 text-red-300')} title={holiday.name}>{holiday.name.length>4?holiday.name.slice(0,3)+'…':holiday.name}</span>}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0,2).map(ev => <div key={ev.id} className={clsx('text-[8px] px-1 py-0.5 rounded truncate font-medium', eventClassName(ev))} title={ev.title}>{categoryForEvent(ev).label} · {ev.title}</div>)}
                {dayData?.items.slice(0, holiday?1:2).map((item, i) => <div key={i} className={clsx('text-[8px] px-1 py-0.5 rounded truncate font-medium', colorForItem(item.test_item))} title={`${item.test_item} ${item.sample_count}건`}>{item.test_item} {item.sample_count}</div>)}
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-navy-600 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400/60" />공휴일</span>
        {EVENT_CATEGORIES.map(c => <span key={c.id} className="flex items-center gap-1"><span className={clsx('w-2 h-2 rounded', c.dotClass)} />{c.label}</span>)}
        {[...allItems].slice(0,3).map(item => <span key={item} className={clsx('px-1.5 py-0.5 rounded', colorForItem(item))}>{item}</span>)}
      </div>
    </div>
  )
}
