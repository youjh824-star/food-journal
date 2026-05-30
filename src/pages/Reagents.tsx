import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, AlertTriangle, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { fetchReagents, createReagent, updateReagent, deleteReagent, Reagent } from '../lib/supabase'
import Spinner from '../components/Spinner'

type Form = {
  name: string; management_number: string; concentration: string
  stock_amount: number; stock_unit: string; min_stock: number
  expiry_date: string; open_date: string; manufacture_date: string
  manufacturer: string; lot_number: string; notes: string
}

const emptyForm = (): Form => ({
  name: '', management_number: '', concentration: '',
  stock_amount: 0, stock_unit: 'mL', min_stock: 0,
  expiry_date: '', open_date: '', manufacture_date: '',
  manufacturer: '', lot_number: '', notes: '',
})

const reagentToForm = (r: Reagent): Form => ({
  name: r.name, management_number: r.management_number ?? '',
  concentration: r.concentration ?? '', stock_amount: r.stock_amount,
  stock_unit: r.stock_unit, min_stock: r.min_stock,
  expiry_date: r.expiry_date ?? '', open_date: r.open_date ?? '',
  manufacture_date: r.manufacture_date ?? '', manufacturer: r.manufacturer ?? '',
  lot_number: r.lot_number ?? '', notes: r.notes ?? '',
})

const inp = 'w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors'

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[11px] text-slate-400 block mb-1">{label}</label>
      {children}
    </div>
  )
}

function isLowStock(r: Reagent) { return r.stock_amount <= r.min_stock }
function isExpiring(r: Reagent) {
  if (!r.expiry_date) return false
  return (new Date(r.expiry_date).getTime() - Date.now()) / 86400000 <= 30
}

function ReagentForm({ form, onChange, onSubmit, onCancel, label }: {
  form: Form; onChange: (f: Form) => void; onSubmit: () => void; onCancel: () => void; label: string
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {([
        ['시약명 *', 'name', '예: Nitric Acid 65%', '', 'col-span-2 lg:col-span-1'],
        ['관리번호', 'management_number', '예: R-2024-001', ''],
        ['농도', 'concentration', '예: 65%, 10 mg/L', ''],
        ['제조사', 'manufacturer', '', ''],
        ['Lot 번호', 'lot_number', '', ''],
        ['메모', 'notes', '보관 조건, 위치 등', 'col-span-2 lg:col-span-3'],
      ] as [string, keyof Form, string, string, string?][]).map(([l, k, p, , cls]) => (
        <Field key={k} label={l} className={cls}>
          <input className={inp} placeholder={p} value={String(form[k])} onChange={e => onChange({ ...form, [k]: e.target.value })} />
        </Field>
      ))}
      <Field label="재고량">
        <input type="number" className={inp} value={form.stock_amount} onChange={e => onChange({ ...form, stock_amount: Number(e.target.value) })} />
      </Field>
      <Field label="단위">
        <input className={inp} placeholder="mL, g 등" value={form.stock_unit} onChange={e => onChange({ ...form, stock_unit: e.target.value })} />
      </Field>
      <Field label="최소 재고">
        <input type="number" className={inp} value={form.min_stock} onChange={e => onChange({ ...form, min_stock: Number(e.target.value) })} />
      </Field>
      <Field label="유효기간">
        <input type="date" className={inp} value={form.expiry_date} onChange={e => onChange({ ...form, expiry_date: e.target.value })} />
      </Field>
      <Field label="개봉일">
        <input type="date" className={inp} value={form.open_date} onChange={e => onChange({ ...form, open_date: e.target.value })} />
      </Field>
      <Field label="제조일">
        <input type="date" className={inp} value={form.manufacture_date} onChange={e => onChange({ ...form, manufacture_date: e.target.value })} />
      </Field>
      <div className="col-span-2 lg:col-span-3 flex gap-2">
        <button onClick={onSubmit} className="flex items-center gap-1.5 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500"><Check className="w-3.5 h-3.5" />{label}</button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-navy-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-600"><X className="w-3.5 h-3.5" />취소</button>
      </div>
    </div>
  )
}

export default function ReagentsPage() {
  const [items, setItems] = useState<Reagent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [editForm, setEditForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)

  const load = () => fetchReagents().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    await createReagent({ name: form.name, management_number: form.management_number || undefined, concentration: form.concentration || undefined, stock_amount: form.stock_amount, stock_unit: form.stock_unit, min_stock: form.min_stock, expiry_date: form.expiry_date || undefined, open_date: form.open_date || undefined, manufacture_date: form.manufacture_date || undefined, manufacturer: form.manufacturer || undefined, lot_number: form.lot_number || undefined, notes: form.notes || undefined })
    setForm(emptyForm()); setShowForm(false); load()
  }

  const handleSave = async () => {
    if (editingId == null || !editForm.name.trim()) return
    await updateReagent(editingId, { name: editForm.name, management_number: editForm.management_number || undefined, concentration: editForm.concentration || undefined, stock_amount: editForm.stock_amount, stock_unit: editForm.stock_unit, min_stock: editForm.min_stock, expiry_date: editForm.expiry_date || undefined, open_date: editForm.open_date || undefined, manufacture_date: editForm.manufacture_date || undefined, manufacturer: editForm.manufacturer || undefined, lot_number: editForm.lot_number || undefined, notes: editForm.notes || undefined })
    setEditingId(null); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteReagent(id); load()
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">시약 관리</h1>
          <p className="text-xs text-slate-400 mt-0.5">시약·표준품 재고 및 유효기간 관리</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500">
          <Plus className="w-4 h-4" />시약 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3">새 시약 등록</p>
          <ReagentForm form={form} onChange={setForm} onSubmit={handleCreate} onCancel={() => setShowForm(false)} label="등록" />
        </div>
      )}

      {editingId != null && (
        <div className="bg-navy-800 border border-cyan-500/30 rounded-xl p-4">
          <p className="text-xs text-cyan-400 mb-3">시약 정보 수정</p>
          <ReagentForm form={editForm} onChange={setEditForm} onSubmit={handleSave} onCancel={() => setEditingId(null)} label="저장" />
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600 text-xs text-slate-400">
                {['관리번호', '시약명', '농도', '재고', '유효기간', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">등록된 시약이 없습니다.</td></tr>
              )}
              {items.map(r => (
                <tr key={r.id} className="hover:bg-navy-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.management_number || '-'}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {r.name}
                    {isLowStock(r) && <AlertTriangle className="w-3.5 h-3.5 text-red-400 inline ml-1" />}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.concentration || '-'}</td>
                  <td className={clsx('px-4 py-3 font-mono', isLowStock(r) ? 'text-red-400' : 'text-slate-300')}>
                    {r.stock_amount} {r.stock_unit}
                  </td>
                  <td className="px-4 py-3">
                    {r.expiry_date ? (
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', isExpiring(r) ? 'bg-yellow-900/40 text-yellow-400' : 'bg-navy-700 text-slate-300')}>
                        {r.expiry_date}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditingId(r.id); setEditForm(reagentToForm(r)); setShowForm(false) }} className="p-1.5 rounded hover:bg-navy-600 text-cyan-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-navy-600 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
