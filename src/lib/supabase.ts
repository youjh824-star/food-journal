import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 환경변수를 설정하세요.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── 데이터 타입 ───────────────────────────────────────────────────────────────

export interface WorkLog {
  id: number
  log_date: string
  project_name: string
  test_item?: string
  sample_count?: number
  workload?: number
  equipment_name?: string
  duration_hours?: number
  operator?: string
  status?: string
  notes?: string
  created_at: string
}

export interface Sample {
  id: number
  sample_id?: string
  project_name?: string
  test_item?: string
  sample_count?: number
  receive_date?: string
  deadline?: string
  status?: string
  notes?: string
  created_at: string
}

export interface Equipment {
  id: number
  name: string
  model?: string
  equipment_type?: string
  analysis_items?: string
  status?: string
  last_maintenance?: string
  next_maintenance?: string
  notes?: string
  open_issue_count?: number
  is_abnormal?: boolean
  total_usage_hours?: number
}

export interface ExperimentMethod {
  id: number
  title: string
  test_item?: string
  description?: string
  file_name?: string
  file_type?: string
  file_url?: string
  file_size?: number
  created_at: string
}

// ── 쿼리 헬퍼 ────────────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [todayLogs, weekLogs, monthSamples, equipment] = await Promise.all([
    supabase
      .from('work_logs')
      .select('id', { count: 'exact' })
      .eq('log_date', today),
    supabase
      .from('work_logs')
      .select('id,sample_count,workload', { count: 'exact' })
      .gte('log_date', weekAgo),
    supabase
      .from('work_logs')
      .select('sample_count')
      .gte('log_date', monthAgo),
    supabase
      .from('equipment')
      .select('id,name,status', { count: 'exact' }),
  ])

  const weekSamples = (weekLogs.data ?? []).reduce(
    (s, r) => s + (r.sample_count ?? 0), 0,
  )
  const monthSampleTotal = (monthSamples.data ?? []).reduce(
    (s, r) => s + (r.sample_count ?? 0), 0,
  )

  return {
    todayCount: todayLogs.count ?? 0,
    weekCount: weekLogs.count ?? 0,
    weekSamples,
    monthSamples: monthSampleTotal,
    equipmentTotal: equipment.count ?? 0,
  }
}

export async function createWorkLog(payload: Partial<WorkLog>): Promise<WorkLog> {
  const { data, error } = await supabase.from('work_logs').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data as WorkLog
}

export async function updateWorkLog(id: number, payload: Partial<WorkLog>) {
  const { error } = await supabase.from('work_logs').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteWorkLog(id: number) {
  const { error } = await supabase.from('work_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchRecentWorkLogs(limit = 10): Promise<WorkLog[]> {
  const { data } = await supabase
    .from('work_logs')
    .select('*')
    .order('log_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  return (data ?? []) as WorkLog[]
}

export async function fetchWorkLogs(opts: {
  search?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}): Promise<{ data: WorkLog[]; count: number }> {
  const { search, from, to, page = 0, pageSize = 20 } = opts
  let q = supabase
    .from('work_logs')
    .select('*', { count: 'exact' })
    .order('log_date', { ascending: false })
    .order('id', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (search) q = q.ilike('project_name', `%${search}%`)
  if (from)   q = q.gte('log_date', from)
  if (to)     q = q.lte('log_date', to)

  const { data, count } = await q
  return { data: (data ?? []) as WorkLog[], count: count ?? 0 }
}

export async function fetchMonthlyStats(months = 6) {
  const from = new Date()
  from.setMonth(from.getMonth() - months)
  const { data } = await supabase
    .from('work_logs')
    .select('log_date,sample_count,workload')
    .gte('log_date', from.toISOString().slice(0, 10))
    .order('log_date')
  return data ?? []
}

export async function fetchEquipment(): Promise<Equipment[]> {
  const { data } = await supabase.from('equipment').select('*').order('name')
  return (data ?? []) as Equipment[]
}

export async function fetchMethods(testItem?: string): Promise<ExperimentMethod[]> {
  let q = supabase.from('experiment_methods').select('*').order('created_at', { ascending: false })
  if (testItem) q = q.eq('test_item', testItem)
  const { data } = await q
  return (data ?? []) as ExperimentMethod[]
}

export async function createSample(payload: Partial<Sample>): Promise<Sample> {
  const { data, error } = await supabase.from('samples').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data as Sample
}

export async function updateSample(id: number, payload: Partial<Sample>) {
  const { error } = await supabase.from('samples').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSample(id: number) {
  const { error } = await supabase.from('samples').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchSamples(opts: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ data: Sample[]; count: number }> {
  const { search, page = 0, pageSize = 20 } = opts
  let q = supabase
    .from('samples')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (search) q = q.ilike('project_name', `%${search}%`)
  const { data, count } = await q
  return { data: (data ?? []) as Sample[], count: count ?? 0 }
}

// ── 장비 ─────────────────────────────────────────────────────────────────────

export interface EquipmentIssue {
  id: number
  equipment_id: number
  title: string
  description?: string
  issue_type: string
  status: string
  occurred_at?: string
  repaired_at?: string
  notes?: string
  created_at: string
}

export async function fetchEquipmentIssues(equipmentId: number): Promise<EquipmentIssue[]> {
  const { data } = await supabase
    .from('equipment_issues')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('occurred_at', { ascending: false })
  return (data ?? []) as EquipmentIssue[]
}

export async function createEquipment(payload: Partial<Equipment>) {
  const { data, error } = await supabase.from('equipment').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data as Equipment
}

export async function updateEquipment(id: number, payload: Partial<Equipment>) {
  const { error } = await supabase.from('equipment').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteEquipment(id: number) {
  const { error } = await supabase.from('equipment').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createEquipmentIssue(payload: Partial<EquipmentIssue>) {
  const { error } = await supabase.from('equipment_issues').insert([payload])
  if (error) throw new Error(error.message)
}

export async function updateEquipmentIssue(id: number, payload: Partial<EquipmentIssue>) {
  const { error } = await supabase.from('equipment_issues').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteEquipmentIssue(id: number) {
  const { error } = await supabase.from('equipment_issues').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── 시약 ─────────────────────────────────────────────────────────────────────

export interface Reagent {
  id: number
  name: string
  management_number?: string
  concentration?: string
  stock_amount: number
  stock_unit: string
  min_stock: number
  expiry_date?: string
  open_date?: string
  manufacture_date?: string
  manufacturer?: string
  lot_number?: string
  notes?: string
  created_at: string
}

export async function fetchReagents(): Promise<Reagent[]> {
  const { data } = await supabase.from('reagents').select('*').order('name')
  return (data ?? []) as Reagent[]
}

export async function createReagent(payload: Partial<Reagent>) {
  const { error } = await supabase.from('reagents').insert([payload])
  if (error) throw new Error(error.message)
}

export async function updateReagent(id: number, payload: Partial<Reagent>) {
  const { error } = await supabase.from('reagents').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteReagent(id: number) {
  const { error } = await supabase.from('reagents').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── 할 일 ─────────────────────────────────────────────────────────────────────

export interface TodoItem {
  id: number
  title: string
  schedule_type: string
  priority: string
  is_done: boolean
  done_date?: string
  recurrence_weekday?: number
  recurrence_day?: number
  notes?: string
  created_at: string
}

export async function fetchTodos(): Promise<TodoItem[]> {
  const { data } = await supabase
    .from('todo_items')
    .select('*')
    .order('priority')
    .order('created_at')
  return (data ?? []) as TodoItem[]
}

export async function createTodo(payload: Partial<TodoItem>) {
  const { error } = await supabase.from('todo_items').insert([payload])
  if (error) throw new Error(error.message)
}

export async function updateTodo(id: number, payload: Partial<TodoItem>) {
  const { error } = await supabase.from('todo_items').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTodo(id: number) {
  const { error } = await supabase.from('todo_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── 달력 이벤트 ───────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: number
  title: string
  event_date: string
  category?: string
  color?: string
  description?: string
  created_at?: string
}

export async function fetchCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const { data } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date')
  return (data ?? []) as CalendarEvent[]
}

export async function createCalendarEvent(payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const { data, error } = await supabase.from('calendar_events').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data as CalendarEvent
}

export async function updateCalendarEvent(id: number, payload: Partial<CalendarEvent>) {
  const { error } = await supabase.from('calendar_events').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCalendarEvent(id: number) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── 달력용 업무 데이터 (날짜별 집계) ─────────────────────────────────────────

export interface CalendarDayData {
  date: string
  items: { test_item: string; sample_count: number; project: string; equipment: string }[]
  total_samples: number
}

export async function fetchCalendarWorkData(startDate: string, endDate: string): Promise<CalendarDayData[]> {
  const { data } = await supabase
    .from('work_logs')
    .select('log_date,test_item,sample_count,project_name,equipment_name')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date')

  const dayMap: Record<string, CalendarDayData> = {}
  for (const row of (data ?? [])) {
    const d = String(row.log_date).slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, items: [], total_samples: 0 }
    dayMap[d].items.push({
      test_item: row.test_item ?? '',
      sample_count: row.sample_count ?? 0,
      project: row.project_name ?? '',
      equipment: row.equipment_name ?? '',
    })
    dayMap[d].total_samples += row.sample_count ?? 0
  }
  return Object.values(dayMap)
}

// ── 대시보드 전체 데이터 ───────────────────────────────────────────────────────

export interface DashboardFullData {
  kpi: { today_workload: number; week_workload: number; month_workload: number; retest_rate: number }
  todos: Array<{ id: number; title: string; priority: string; completed: boolean }>
  anomalies: Array<{ id: number; description: string; severity: string }>
  expiring_reagents: Array<{ id: number; name: string; expiry_date: string }>
  insights: string[]
  week_trend: Array<{ label: string; samples: number }>
  top_test_items: Array<{ name: string; value: number }>
}

function generateInsights(
  weekLogs: number, monthLogs: number,
  topItem: string | undefined, anomalyCount: number, expiringCount: number,
): string[] {
  const msgs: string[] = []
  if (weekLogs > 0) msgs.push(`이번 주 ${weekLogs}건의 업무일지가 등록되었습니다.`)
  if (topItem) msgs.push(`이번 달 가장 많이 분석한 시험항목은 "${topItem}"입니다.`)
  if (anomalyCount > 0) msgs.push(`현재 ${anomalyCount}건의 장비 이상이 확인되었습니다. 점검이 필요합니다.`)
  if (expiringCount > 0) msgs.push(`유효기간 임박 시약이 ${expiringCount}건 있습니다. 확인하세요.`)
  if (monthLogs >= 20) msgs.push('이번 달 분석량이 활발합니다. 수고 많으십니다!')
  if (msgs.length === 0) msgs.push('데이터가 쌓이면 인사이트가 표시됩니다.')
  return msgs
}

export async function fetchDashboardFull(): Promise<DashboardFullData> {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const todayDow = new Date().getDay()

  const [todayLogsRes, weekLogsRes, monthLogsRes, todosRes, openIssuesRes, reagentsRes, allEquipmentIssues] = await Promise.all([
    supabase.from('work_logs').select('sample_count,workload').eq('log_date', today),
    supabase.from('work_logs').select('log_date,sample_count,workload,test_item').gte('log_date', weekAgo),
    supabase.from('work_logs').select('sample_count,workload,test_item').gte('log_date', monthAgo),
    supabase.from('todo_items').select('id,title,priority,is_done,schedule_type,recurrence_weekday').order('priority').order('created_at'),
    supabase.from('equipment_issues').select('id,title,issue_type,status').eq('status', 'open').order('created_at', { ascending: false }).limit(10),
    supabase.from('reagents').select('id,name,expiry_date').lte('expiry_date', in30Days).gte('expiry_date', today).order('expiry_date').limit(10),
    supabase.from('equipment_issues').select('id,equipment_id,status').eq('status', 'open'),
  ])

  const todayWorkload = (todayLogsRes.data ?? []).reduce((s, r) => s + (r.workload ?? r.sample_count ?? 0), 0)
  const weekWorkload  = (weekLogsRes.data  ?? []).reduce((s, r) => s + (r.workload ?? r.sample_count ?? 0), 0)
  const monthWorkload = (monthLogsRes.data ?? []).reduce((s, r) => s + (r.workload ?? r.sample_count ?? 0), 0)

  // Issue rate = open issues / month logs * 100
  const retestRate = monthLogsRes.data?.length
    ? Math.round(((allEquipmentIssues.data?.length ?? 0) / monthLogsRes.data.length) * 100)
    : 0

  // Today's todos: 'daily', or weekly matching today's weekday, or 'once' not done
  const allTodos = (todosRes.data ?? []) as TodoItem[]
  const todayTodos = allTodos.filter(t => {
    if (t.is_done) return false
    if (t.schedule_type === 'daily') return true
    if (t.schedule_type === 'weekly' && t.recurrence_weekday === todayDow) return true
    if (t.schedule_type === 'once') return true
    return false
  }).slice(0, 5)

  // Anomalies
  const anomalies = (openIssuesRes.data ?? []).map(i => ({
    id: i.id,
    description: i.title,
    severity: i.issue_type === 'breakdown' ? 'error' : 'warning',
  }))

  // Expiring reagents
  const expiringReagents = (reagentsRes.data ?? []).map(r => ({
    id: r.id, name: r.name, expiry_date: r.expiry_date as string,
  }))

  // Weekly trend (last 7 days)
  const weekData = weekLogsRes.data ?? []
  const trendMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    trendMap[key] = 0
  }
  weekData.forEach(r => {
    const key = String(r.log_date).slice(0, 10)
    if (key in trendMap) trendMap[key] += r.sample_count ?? 0
  })
  const week_trend = Object.entries(trendMap).map(([date, samples]) => ({
    label: date.slice(5), samples,
  }))

  // Top test items
  const itemCounts: Record<string, number> = {}
  ;(monthLogsRes.data ?? []).forEach(r => {
    if (r.test_item) itemCounts[r.test_item] = (itemCounts[r.test_item] ?? 0) + (r.sample_count ?? 1)
  })
  const top_test_items = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const topItem = top_test_items[0]?.name
  const insights = generateInsights(weekLogsRes.data?.length ?? 0, monthLogsRes.data?.length ?? 0, topItem, anomalies.length, expiringReagents.length)

  return {
    kpi: { today_workload: todayWorkload, week_workload: weekWorkload, month_workload: monthWorkload, retest_rate: retestRate },
    todos: todayTodos.map(t => ({ id: t.id, title: t.title, priority: t.priority, completed: t.is_done })),
    anomalies,
    expiring_reagents: expiringReagents,
    insights,
    week_trend,
    top_test_items,
  }
}

// ── 상세 통계 ─────────────────────────────────────────────────────────────────

export async function fetchDetailedStats(days = 30) {
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('work_logs')
    .select('log_date,sample_count,workload,equipment_name,test_item,project_name,duration_hours')
    .gte('log_date', from)
    .order('log_date')
  return (data ?? []) as Array<{
    log_date: string
    sample_count?: number
    workload?: number
    equipment_name?: string
    test_item?: string
    project_name?: string
    duration_hours?: number
  }>
}
