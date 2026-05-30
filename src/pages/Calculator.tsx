import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'

const inp = 'w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors'
const label = 'text-[11px] text-slate-400 block mb-1'

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 mb-4">{subtitle}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

function Result({ label: l, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy-900 border border-navy-600 rounded-xl p-3 mt-3">
      <p className="text-[11px] text-slate-400">{l}</p>
      <p className="text-xl font-bold text-cyan-400 font-mono mt-1">{value}</p>
    </div>
  )
}

// ── 희석 계산기 ───────────────────────────────────────────────────────────────
function DilutionCalc() {
  const [c1, setC1] = useState(''); const [v1, setV1] = useState('')
  const [c2, setC2] = useState(''); const [v2, setV2] = useState('')
  const [solve, setSolve] = useState<'v1'|'v2'|'c1'|'c2'>('v1')

  const calc = () => {
    const nc1 = parseFloat(c1), nc2 = parseFloat(c2)
    const nv1 = parseFloat(v1), nv2 = parseFloat(v2)
    if (solve === 'v1' && !isNaN(nc1) && !isNaN(nc2) && !isNaN(nv2)) return `V1 = ${(nc2 * nv2 / nc1).toFixed(4)} mL`
    if (solve === 'v2' && !isNaN(nc1) && !isNaN(nc2) && !isNaN(nv1)) return `V2 = ${(nc1 * nv1 / nc2).toFixed(4)} mL`
    if (solve === 'c1' && !isNaN(nc2) && !isNaN(nv1) && !isNaN(nv2)) return `C1 = ${(nc2 * nv2 / nv1).toFixed(6)} mg/L`
    if (solve === 'c2' && !isNaN(nc1) && !isNaN(nv1) && !isNaN(nv2)) return `C2 = ${(nc1 * nv1 / nv2).toFixed(6)} mg/L`
    return null
  }
  const result = calc()

  return (
    <Card title="희석 계산기" subtitle="C₁V₁ = C₂V₂ 공식 기반">
      <div>
        <label className={label}>구하는 값</label>
        <div className="grid grid-cols-4 gap-1 bg-navy-700 rounded-lg p-1">
          {(['v1','v2','c1','c2'] as const).map(k => (
            <button key={k} onClick={() => setSolve(k)} className={`py-1.5 rounded-md text-xs font-medium transition-colors ${solve === k ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>C₁ (mg/L)</label><input className={inp} placeholder={solve === 'c1' ? '구하는 값' : '원액 농도'} value={c1} onChange={e => setC1(e.target.value)} disabled={solve === 'c1'} /></div>
        <div><label className={label}>V₁ (mL)</label><input className={inp} placeholder={solve === 'v1' ? '구하는 값' : '취한 부피'} value={v1} onChange={e => setV1(e.target.value)} disabled={solve === 'v1'} /></div>
        <div><label className={label}>C₂ (mg/L)</label><input className={inp} placeholder={solve === 'c2' ? '구하는 값' : '희석 농도'} value={c2} onChange={e => setC2(e.target.value)} disabled={solve === 'c2'} /></div>
        <div><label className={label}>V₂ (mL)</label><input className={inp} placeholder={solve === 'v2' ? '구하는 값' : '최종 부피'} value={v2} onChange={e => setV2(e.target.value)} disabled={solve === 'v2'} /></div>
      </div>
      {result && <Result label="계산 결과" value={result} />}
    </Card>
  )
}

// ── 표준용액 계산기 ──────────────────────────────────────────────────────────
function StandardCalc() {
  const [stockConc, setStockConc] = useState('')
  const [targetConc, setTargetConc] = useState('')
  const [finalVol, setFinalVol] = useState('')

  const calcVol = () => {
    const sc = parseFloat(stockConc), tc = parseFloat(targetConc), fv = parseFloat(finalVol)
    if (isNaN(sc) || isNaN(tc) || isNaN(fv) || sc === 0) return null
    const vol = (tc * fv) / sc
    return `취할 부피: ${vol.toFixed(4)} mL`
  }
  const result = calcVol()

  return (
    <Card title="표준용액 계산기" subtitle="원액에서 목표 농도 표준용액 제조">
      <div><label className={label}>원액 농도 (mg/L)</label><input className={inp} placeholder="예: 1000" value={stockConc} onChange={e => setStockConc(e.target.value)} /></div>
      <div><label className={label}>목표 농도 (mg/L)</label><input className={inp} placeholder="예: 10" value={targetConc} onChange={e => setTargetConc(e.target.value)} /></div>
      <div><label className={label}>최종 부피 (mL)</label><input className={inp} placeholder="예: 100" value={finalVol} onChange={e => setFinalVol(e.target.value)} /></div>
      {result && <Result label="계산 결과" value={result} />}
    </Card>
  )
}

// ── 단위 변환 ────────────────────────────────────────────────────────────────
function ConvertCalc() {
  const [val, setVal] = useState('')
  const [from, setFrom] = useState('mg/L')
  const [to, setTo] = useState('μg/L')

  const UNITS: Record<string, number> = { 'g/L': 1000, 'mg/L': 1, 'μg/L': 0.001, 'ng/L': 0.000001, '%': 10000 }
  const units = Object.keys(UNITS)

  const convert = () => {
    const v = parseFloat(val)
    if (isNaN(v)) return null
    const result = v * (UNITS[from] / UNITS[to])
    return `${v} ${from} = ${result.toExponential(4)} ${to}`
  }
  const result = convert()

  return (
    <Card title="단위 변환" subtitle="농도 단위 자동 변환">
      <div><label className={label}>값</label><input className={inp} placeholder="숫자 입력" value={val} onChange={e => setVal(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>변환 전</label>
          <select className={inp} value={from} onChange={e => setFrom(e.target.value)}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>변환 후</label>
          <select className={inp} value={to} onChange={e => setTo(e.target.value)}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      {result && <Result label="변환 결과" value={result} />}
    </Card>
  )
}

// ── 퍼센트 농도 ──────────────────────────────────────────────────────────────
function PercentCalc() {
  const [mass, setMass] = useState('')
  const [volume, setVolume] = useState('')
  const [density, setDensity] = useState('1')

  const calc = () => {
    const m = parseFloat(mass), v = parseFloat(volume), d = parseFloat(density)
    if (isNaN(m) || isNaN(v) || v === 0) return null
    const pct = (m / v) * 100
    const mgL = isNaN(d) ? null : (m * d * 10)
    return mgL != null ? `w/v: ${pct.toFixed(4)}% · mg/L: ${(mgL).toFixed(2)}` : `w/v: ${pct.toFixed(4)}%`
  }
  const result = calc()

  return (
    <Card title="퍼센트 농도" subtitle="용질 질량과 용액 부피로 w/v% 계산">
      <div><label className={label}>용질 질량 (g)</label><input className={inp} placeholder="예: 5" value={mass} onChange={e => setMass(e.target.value)} /></div>
      <div><label className={label}>용액 부피 (mL)</label><input className={inp} placeholder="예: 100" value={volume} onChange={e => setVolume(e.target.value)} /></div>
      <div><label className={label}>밀도 (g/mL, 선택)</label><input className={inp} placeholder="기본 1.0" value={density} onChange={e => setDensity(e.target.value)} /></div>
      {result && <Result label="계산 결과" value={result} />}
    </Card>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dilution',  label: '희석 계산'  },
  { id: 'standard',  label: '표준용액'   },
  { id: 'convert',   label: '단위 변환'  },
  { id: 'percent',   label: '퍼센트 농도' },
]

export default function CalculatorPage() {
  const [tab, setTab] = useState('dilution')

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-cyan-400" />실험실 계산기
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">농도·희석·표준용액 계산</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-cyan-600 text-white' : 'bg-navy-800 text-slate-400 hover:text-white border border-navy-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dilution'  && <DilutionCalc />}
      {tab === 'standard'  && <StandardCalc />}
      {tab === 'convert'   && <ConvertCalc />}
      {tab === 'percent'   && <PercentCalc />}
    </div>
  )
}
