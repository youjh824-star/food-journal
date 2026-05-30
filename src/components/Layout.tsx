import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, FlaskConical, BookOpen, BarChart2 } from 'lucide-react'
import clsx from 'clsx'

const TABS = [
  { to: '/',         icon: LayoutDashboard, label: '홈'      },
  { to: '/worklogs', icon: ClipboardList,   label: '업무일지' },
  { to: '/samples',  icon: FlaskConical,    label: '샘플'    },
  { to: '/methods',  icon: BookOpen,        label: '실험법'   },
  { to: '/stats',    icon: BarChart2,       label: '통계'    },
]

export default function Layout() {
  return (
    <div className="flex flex-col h-dvh bg-navy-900 text-slate-100 overflow-hidden">
      {/* 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      {/* 하단 탭 바 */}
      <nav className="flex-shrink-0 border-t border-navy-600 bg-navy-800 safe-area-bottom">
        <div className="flex">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-slate-400 hover:text-slate-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]')} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
