export type EventCategoryId = 'off' | 'training' | 'vacation' | 'annual' | 'workshop' | 'general'

export interface EventCategory {
  id: EventCategoryId; label: string; color: string; className: string; dotClass: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 'off',      label: '휴무',   color: 'slate',  className: 'bg-slate-500/85 text-white',  dotClass: 'bg-slate-400'  },
  { id: 'training', label: '교육',   color: 'blue',   className: 'bg-blue-500/85 text-white',   dotClass: 'bg-blue-400'   },
  { id: 'vacation', label: '휴가',   color: 'green',  className: 'bg-green-500/85 text-white',  dotClass: 'bg-green-400'  },
  { id: 'annual',   label: '연차',   color: 'purple', className: 'bg-purple-500/85 text-white', dotClass: 'bg-purple-400' },
  { id: 'workshop', label: '워크샵', color: 'orange', className: 'bg-orange-500/85 text-white', dotClass: 'bg-orange-400' },
  { id: 'general',  label: '기타',   color: 'cyan',   className: 'bg-cyan-500/85 text-white',   dotClass: 'bg-cyan-400'   },
]

const byId = Object.fromEntries(EVENT_CATEGORIES.map(c => [c.id, c])) as Record<EventCategoryId, EventCategory>
const colorToCategory: Record<string, EventCategoryId> = {
  cyan: 'general', purple: 'annual', yellow: 'workshop', green: 'vacation',
  orange: 'workshop', blue: 'training', slate: 'off',
}

export function categoryForEvent(ev: { category?: string; color?: string }): EventCategory {
  if (ev.category && ev.category in byId) return byId[ev.category as EventCategoryId]
  const fromColor = ev.color ? colorToCategory[ev.color] : undefined
  return byId[fromColor || 'general']
}

export function eventClassName(ev: { category?: string; color?: string }): string {
  return categoryForEvent(ev).className
}

export const DEFAULT_EVENT_CATEGORY: EventCategoryId = 'general'
