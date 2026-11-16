import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Activity,
  CalendarDays,
  CheckSquare,
  BarChart2,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onCollapse: () => void
}

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  highlight?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/study-tracker', label: 'Study Tracker', icon: <BookOpen size={18} />, highlight: true },
  { to: '/subjects', label: 'Subjects & Topics', icon: <Library size={18} /> },
  { to: '/activity-log', label: 'Activity Log', icon: <Activity size={18} /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarDays size={18} /> },
  { to: '/tasks', label: 'Tasks & Reminders', icon: <CheckSquare size={18} /> },
  { to: '/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
]

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-white border-r border-border flex-shrink-0 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
        <Clock size={20} className="text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="text-base font-bold text-primary tracking-tight">DayTrack</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-lavender-pale text-primary font-medium'
                  : item.highlight
                  ? 'text-primary hover:bg-lavender-pale font-medium'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-border p-2">
        <button
          onClick={onCollapse}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-text-secondary hover:bg-bg-secondary transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
