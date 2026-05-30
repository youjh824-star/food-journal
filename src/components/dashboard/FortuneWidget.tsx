import { Sparkles } from 'lucide-react'
import { BIRTH_PROFILE, getPersonalFortunes } from '../../lib/fortune'

export default function FortuneWidget() {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const todayF = getPersonalFortunes(today)
  const tomorrowF = getPersonalFortunes(tomorrow)
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400" /> 오늘·내일 운세
      </h3>
      <p className="text-[10px] text-slate-500 mb-3">{BIRTH_PROFILE.summary}</p>
      <div className="grid grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-1">
        <div>
          <p className="text-xs text-cyan-400 font-medium mb-2">오늘</p>
          <div className="space-y-1.5">
            {todayF.map(f => (
              <div key={f.label} className="text-xs leading-relaxed">
                <span className={`font-medium ${f.color}`}>{f.label}</span>
                <span className="text-slate-400 ml-1.5">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">내일</p>
          <div className="space-y-1.5">
            {tomorrowF.map(f => (
              <div key={f.label} className="text-xs leading-relaxed">
                <span className={`font-medium ${f.color} opacity-70`}>{f.label}</span>
                <span className="text-slate-500 ml-1.5">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
