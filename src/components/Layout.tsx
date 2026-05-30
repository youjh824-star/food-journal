import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, FlaskConical, BookOpen, BarChart2,
  Cpu, Beaker, CheckSquare, Calculator, Menu, X, ChevronLeft,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: '대시보드'   },
  { to: '/worklogs',  icon: ClipboardList,   label: '업무일지'   },
  { to: '/samples',   icon: FlaskConical,    label: '샘플 관리'  },
  { to: '/equipment', icon: Cpu,             label: '장비 관리'  },
  { to: '/reagents',  icon: Beaker,          label: '시약 관리'  },
  { to: '/todos',     icon: CheckSquare,     label: '할 일 관리' },
  { to: '/methods',   icon: BookOpen,        label: '실험법 자료' },
  { to: '/stats',     icon: BarChart2,       label: '업무 통계'  },
  { to: '/calculator',icon: Calculator,      label: '계산기'     },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // 모바일: 페이지 이동 시 사이드바 닫기
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const navLink = (item: typeof NAV[0]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mx-2',
          isActive
            ? 'bg-accent/15 text-cyan-300 font-medium'
            : 'text-slate-400 hover:text-white hover:bg-navy-700',
        )
      }
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )

  return (
    <div className="flex h-dvh bg-navy-900 overflow-hidden">
      {/* ── 모바일 오버레이 ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── 사이드바 ── */}
      <aside
        className={clsx(
          'fixed lg:relative z-40 flex flex-col h-full bg-navy-800 border-r border-navy-600 transition-all duration-200',
          // 데스크탑: 접히면 좁아짐
          collapsed ? 'lg:w-16' : 'lg:w-56',
          // 모바일: 슬라이드 인/아웃
          mobileOpen ? 'w-56 translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* 로고 */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-navy-600 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none">Lab Work Log</p>
              <p className="text-[10px] text-slate-400 mt-0.5">분석실 업무 자동화</p>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 py-2 overflow-y-auto space-y-0.5">
          {NAV.map(navLink)}
        </nav>

        {/* 데스크탑 접기 버튼 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center border-t border-navy-600 py-3 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className={clsx('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span className="text-xs ml-1">접기</span>}
        </button>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 헤더 */}
        <header className="flex-shrink-0 h-12 bg-navy-800 border-b border-navy-600 flex items-center px-4 gap-3">
          {/* 모바일 햄버거 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <span className="text-[11px] text-slate-400 font-mono hidden sm:block">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
            })}
          </span>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto bg-navy-900 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
