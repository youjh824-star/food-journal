import { useEffect, useState } from 'react'
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Plus, Trash2, Pencil, Wrench, Check, X,
} from 'lucide-react'
import clsx from 'clsx'
import {
  fetchEquipment, fetchEquipmentIssues, createEquipment, updateEquipment, deleteEquipment,
  createEquipmentIssue, updateEquipmentIssue, deleteEquipmentIssue,
  Equipment, EquipmentIssue,
} from '../lib/supabase'
import Spinner from '../components/Spinner'

const ISSUE_TYPES: Record<string, string> = {
  malfunction: '이상/고장', maintenance: '정기점검', calibration: '교정', other: '기타',
}

type EqForm = { name: string; model: string; equipment_type: string; analysis_items: string; notes: string; last_maintenance: string; next_maintenance: string }
type IssueForm = { title: string; description: string; issue_type: string; occurred_at: string; notes: string }

const emptyEq = (): EqForm => ({ name: '', model: '', equipment_type: '', analysis_items: '', notes: '', last_maintenance: '', next_maintenance: '' })
const emptyIssue = (): IssueForm => ({ title: '', description: '', issue_type: 'malfunction', occurred_at: new Date().toISOString().slice(0, 16), notes: '' })

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'error' | 'info' | 'warning' }) {
  const cls = { default: 'bg-slate-700 text-slate-300', success: 'bg-emerald-900/40 text-emerald-400', error: 'bg-red-900/40 text-red-400', info: 'bg-blue-900/40 text-blue-300', warning: 'bg-yellow-900/40 text-yellow-400' }
  return <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1', cls[variant])}>{children}</span>
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[11px] text-slate-400 block mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors'

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([])
  const [issues, setIssues] = useState<Record<number, EquipmentIssue[]>>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyEq())
  const [editForm, setEditForm] = useState(emptyEq())
  const [issueForm, setIssueForm] = useState(emptyIssue())
  const [editIssueForm, setEditIssueForm] = useState(emptyIssue())
  const [loading, setLoading] = useState(true)

  const load = () => fetchEquipment().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const loadIssues = async (id: number) => {
    const list = await fetchEquipmentIssues(id)
    setIssues(prev => ({ ...prev, [id]: list }))
  }

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!issues[id]) await loadIssues(id)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    await createEquipment({ name: form.name, model: form.model || undefined, equipment_type: form.equipment_type || undefined, analysis_items: form.analysis_items || undefined, notes: form.notes || undefined, last_maintenance: form.last_maintenance || undefined, next_maintenance: form.next_maintenance || undefined })
    setForm(emptyEq()); setShowForm(false); load()
  }

  const handleSaveEq = async (id: number) => {
    await updateEquipment(id, { name: editForm.name, model: editForm.model || undefined, equipment_type: editForm.equipment_type || undefined, analysis_items: editForm.analysis_items || undefined, notes: editForm.notes || undefined, last_maintenance: editForm.last_maintenance || undefined, next_maintenance: editForm.next_maintenance || undefined })
    setEditingId(null); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteEquipment(id)
    if (expandedId === id) setExpandedId(null)
    load()
  }

  const handleAddIssue = async (eqId: number) => {
    if (!issueForm.title.trim()) return
    await createEquipmentIssue({ equipment_id: eqId, title: issueForm.title, description: issueForm.description || undefined, issue_type: issueForm.issue_type, occurred_at: new Date(issueForm.occurred_at).toISOString(), notes: issueForm.notes || undefined, status: 'open' })
    setIssueForm(emptyIssue()); loadIssues(eqId); load()
  }

  const handleResolve = async (eqId: number, issue: EquipmentIssue) => {
    await updateEquipmentIssue(issue.id, { status: 'resolved', repaired_at: new Date().toISOString() })
    loadIssues(eqId); load()
  }

  const handleSaveIssue = async (eqId: number, issueId: number) => {
    await updateEquipmentIssue(issueId, { title: editIssueForm.title, description: editIssueForm.description || undefined, issue_type: editIssueForm.issue_type, occurred_at: new Date(editIssueForm.occurred_at).toISOString(), notes: editIssueForm.notes || undefined })
    setEditingIssueId(null); loadIssues(eqId)
  }

  const handleDeleteIssue = async (eqId: number, issueId: number) => {
    if (!confirm('이력을 삭제하시겠습니까?')) return
    await deleteEquipmentIssue(issueId); loadIssues(eqId); load()
  }

  const fmtDt = (iso?: string) => iso ? new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

  const EqFormFields = ({ val, set, onSubmit, onCancel, label }: { val: EqForm; set: (f: EqForm) => void; onSubmit: () => void; onCancel: () => void; label: string }) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {([['장비명 *', 'name', '예: ICP-MS'], ['모델명', 'model', '예: Agilent 7900'], ['유형', 'equipment_type', '예: ICP-MS, HPLC']] as [string, keyof EqForm, string][]).map(([l, k, p]) => (
        <Field key={k} label={l}><input className={inp} placeholder={p} value={val[k]} onChange={e => set({ ...val, [k]: e.target.value })} /></Field>
      ))}
      <Field label="분석 항목" className="col-span-2 lg:col-span-2">
        <input className={inp} placeholder="예: Heavy metals, Trace elements" value={val.analysis_items} onChange={e => set({ ...val, analysis_items: e.target.value })} />
      </Field>
      <Field label="메모">
        <input className={inp} placeholder="비고" value={val.notes} onChange={e => set({ ...val, notes: e.target.value })} />
      </Field>
      <Field label="마지막 정비일">
        <input type="date" className={inp} value={val.last_maintenance} onChange={e => set({ ...val, last_maintenance: e.target.value })} />
      </Field>
      <Field label="다음 정비 예정일">
        <input type="date" className={inp} value={val.next_maintenance} onChange={e => set({ ...val, next_maintenance: e.target.value })} />
      </Field>
      <div className="col-span-2 lg:col-span-3 flex gap-2">
        <button onClick={onSubmit} className="flex items-center gap-1.5 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500"><Check className="w-3.5 h-3.5" />{label}</button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-navy-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-600"><X className="w-3.5 h-3.5" />취소</button>
      </div>
    </div>
  )

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">장비 관리</h1>
          <p className="text-xs text-slate-400 mt-0.5">장비 상태 · 이상/수리 이력 · 유지보수</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500">
          <Plus className="w-4 h-4" />장비 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3">새 장비 등록</p>
          <EqFormFields val={form} set={setForm} onSubmit={handleCreate} onCancel={() => setShowForm(false)} label="등록" />
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">등록된 장비가 없습니다.</div>}
        {items.map(eq => {
          const open = expandedId === eq.id
          const eqIssues = issues[eq.id] ?? []
          const hasOpen = (eq as any).open_issue_count > 0 || (eq as any).is_abnormal
          const isEditing = editingId === eq.id

          return (
            <div key={eq.id} className={clsx('bg-navy-800 border rounded-xl overflow-hidden', hasOpen && !isEditing ? 'border-red-500/40' : 'border-navy-600')}>
              {isEditing ? (
                <div className="p-4">
                  <p className="text-xs text-cyan-400 mb-3">장비 정보 수정</p>
                  <EqFormFields val={editForm} set={setEditForm} onSubmit={() => handleSaveEq(eq.id)} onCancel={() => setEditingId(null)} label="저장" />
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4">
                  <button onClick={() => toggleExpand(eq.id)} className="mt-1 text-slate-400 hover:text-white flex-shrink-0">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{eq.name}</span>
                      {eq.model && <span className="text-xs text-slate-400">{eq.model}</span>}
                      <Badge variant={hasOpen ? 'error' : 'success'}>
                        {hasOpen ? <><AlertTriangle className="w-3 h-3" />이상</> : <><CheckCircle className="w-3 h-3" />정상</>}
                      </Badge>
                      {eq.equipment_type && <Badge variant="info">{eq.equipment_type}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      {eq.analysis_items && <span>{eq.analysis_items}</span>}
                      {eq.last_maintenance && <span>마지막 정비: {eq.last_maintenance}</span>}
                      {eq.next_maintenance && <span>다음 정비: {eq.next_maintenance}</span>}
                    </div>
                    {eq.notes && <p className="text-xs text-slate-500 mt-1">{eq.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingId(eq.id); setEditForm({ name: eq.name ?? '', model: eq.model ?? '', equipment_type: eq.equipment_type ?? '', analysis_items: eq.analysis_items ?? '', notes: eq.notes ?? '', last_maintenance: eq.last_maintenance ?? '', next_maintenance: eq.next_maintenance ?? '' }) }} className="p-1.5 rounded hover:bg-navy-700 text-cyan-400">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(eq.id)} className="p-1.5 rounded hover:bg-navy-700 text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {open && !isEditing && (
                <div className="border-t border-navy-600 p-4 bg-navy-900/40">
                  <p className="text-xs text-purple-400 font-medium flex items-center gap-1 mb-3">
                    <Wrench className="w-3 h-3" />이상 · 수리 이력
                  </p>

                  {/* 이력 추가 폼 */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                    <Field label="제목" className="col-span-2">
                      <input className={inp} placeholder="예: 플라즈마 불안정" value={issueForm.title} onChange={e => setIssueForm({ ...issueForm, title: e.target.value })} />
                    </Field>
                    <Field label="유형">
                      <select className={inp} value={issueForm.issue_type} onChange={e => setIssueForm({ ...issueForm, issue_type: e.target.value })}>
                        {Object.entries(ISSUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label="발생 일시">
                      <input type="datetime-local" className={inp} value={issueForm.occurred_at} onChange={e => setIssueForm({ ...issueForm, occurred_at: e.target.value })} />
                    </Field>
                    <Field label="설명" className="col-span-2">
                      <input className={inp} placeholder="증상, 오류 메시지" value={issueForm.description} onChange={e => setIssueForm({ ...issueForm, description: e.target.value })} />
                    </Field>
                    <Field label="메모" className="col-span-2">
                      <input className={inp} placeholder="조치 내용" value={issueForm.notes} onChange={e => setIssueForm({ ...issueForm, notes: e.target.value })} />
                    </Field>
                    <button onClick={() => handleAddIssue(eq.id)} className="col-span-2 lg:col-span-4 bg-cyan-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-cyan-500">이력 추가</button>
                  </div>

                  {eqIssues.length === 0 ? (
                    <p className="text-sm text-slate-500">등록된 이상/수리 이력 없음</p>
                  ) : (
                    <div className="space-y-2">
                      {eqIssues.map(issue => (
                        <div key={issue.id} className={clsx('rounded-lg p-3 text-sm', issue.status === 'open' ? 'bg-red-900/20 border border-red-500/20' : 'bg-navy-800')}>
                          {editingIssueId === issue.id ? (
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="제목" className="col-span-2"><input className={inp} value={editIssueForm.title} onChange={e => setEditIssueForm({ ...editIssueForm, title: e.target.value })} /></Field>
                              <Field label="유형"><select className={inp} value={editIssueForm.issue_type} onChange={e => setEditIssueForm({ ...editIssueForm, issue_type: e.target.value })}>{Object.entries(ISSUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                              <Field label="발생 일시"><input type="datetime-local" className={inp} value={editIssueForm.occurred_at} onChange={e => setEditIssueForm({ ...editIssueForm, occurred_at: e.target.value })} /></Field>
                              <Field label="설명" className="col-span-2"><input className={inp} value={editIssueForm.description} onChange={e => setEditIssueForm({ ...editIssueForm, description: e.target.value })} /></Field>
                              <div className="col-span-2 flex gap-2">
                                <button onClick={() => handleSaveIssue(eq.id, issue.id)} className="bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs">저장</button>
                                <button onClick={() => setEditingIssueId(null)} className="bg-navy-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs">취소</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant={issue.status === 'open' ? 'error' : 'success'}>{issue.status === 'open' ? '미수리' : '수리완료'}</Badge>
                                  <span className="font-medium text-white">{issue.title}</span>
                                  <span className="text-xs text-slate-400">{ISSUE_TYPES[issue.issue_type] ?? issue.issue_type}</span>
                                </div>
                                {issue.description && <p className="text-xs text-slate-300 mb-1">{issue.description}</p>}
                                <p className="text-[11px] text-slate-500 font-mono">발생: {fmtDt(issue.occurred_at)}{issue.repaired_at && ` · 수리: ${fmtDt(issue.repaired_at)}`}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => { setEditingIssueId(issue.id); setEditIssueForm({ title: issue.title, description: issue.description ?? '', issue_type: issue.issue_type, occurred_at: (issue.occurred_at ?? new Date().toISOString()).slice(0, 16), notes: issue.notes ?? '' }) }} className="p-1 text-cyan-400"><Pencil className="w-3 h-3" /></button>
                                {issue.status === 'open' && <button onClick={() => handleResolve(eq.id, issue)} className="text-[11px] px-2 py-1 rounded bg-green-900/40 text-green-400">수리완료</button>}
                                <button onClick={() => handleDeleteIssue(eq.id, issue.id)} className="p-1 text-red-400"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
