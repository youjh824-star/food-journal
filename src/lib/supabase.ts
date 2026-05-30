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
