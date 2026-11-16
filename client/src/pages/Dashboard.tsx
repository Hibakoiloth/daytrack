import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Clock, TrendingUp, BookOpen, Library,
  Layers, CheckCircle2, Activity, ListTodo,
  ChevronRight,
} from 'lucide-react'

import { getDashboardSummary, getStudyAnalytics, getSubjectAnalytics, getActivityAnalytics } from '@/services/analytics'
import { getStudyLogs } from '@/services/studyLogs'
import { getTasks } from '@/services/tasks'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDuration, formatDate, formatShortDate, nDaysAgo, today, startOfMonth } from '@/utils/format'

type DatePeriod = 'today' | '7d' | '30d' | 'month'

function getDateRange(period: DatePeriod): { start: string; end: string } {
  const t = today()
  switch (period) {
    case 'today': return { start: t, end: t }
    case '7d':   return { start: nDaysAgo(6), end: t }
    case '30d':  return { start: nDaysAgo(29), end: t }
    case 'month': return { start: startOfMonth(), end: t }
  }
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#C4C9E5',
  medium: '#6976CC',
  high: '#E4484B',
}

const PRODUCTIVITY_COLORS: Record<string, string> = {
  productive: '#6976CC',
  neutral: '#C4C9E5',
  distracting: '#E98F91',
}

function StudyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="text-text-secondary">{payload[0]?.payload?.date ? formatShortDate(payload[0].payload.date) : ''}</p>
      <p className="font-medium text-text-primary">{formatDuration(Math.round(payload[0].value * 60))}</p>
    </div>
  )
}

function SubjectTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="font-medium text-text-primary">{d?.subjectName}</p>
      <p className="text-text-secondary">{formatDuration(d?.totalMinutes)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState<DatePeriod>('7d')
  const dateRange = useMemo(() => getDateRange(period), [period])

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboardSummary,
  })

  const { data: studyData, isLoading: studyLoading } = useQuery({
    queryKey: ['analytics', 'study', dateRange],
    queryFn: () => getStudyAnalytics({ startDate: dateRange.start, endDate: dateRange.end }),
  })

  const { data: subjects } = useQuery({
    queryKey: ['analytics', 'subjects'],
    queryFn: () => getSubjectAnalytics(),
  })

  const { data: recentLogs } = useQuery({
    queryKey: ['study-logs', 'recent'],
    queryFn: () => getStudyLogs(),
    select: (logs) => logs.slice(0, 5),
  })

  const { data: pendingTasks } = useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: () => getTasks({ status: 'pending' }),
    select: (tasks) => tasks.slice(0, 5),
  })

  const { data: activityData } = useQuery({
    queryKey: ['analytics', 'activity'],
    queryFn: () => getActivityAnalytics(),
  })

  const chartData = useMemo(() => {
    return (studyData?.daily ?? []).map(d => ({
      date: d.date,
      hours: Math.round((d.minutes / 60) * 10) / 10,
    }))
  }, [studyData])

  const subjectPieData = useMemo(() => {
    return (subjects ?? []).filter(s => s.totalMinutes > 0)
  }, [subjects])

  const periodButtons: { key: DatePeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'month', label: 'This Month' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <span className="text-sm text-text-secondary">{formatDate(today())}</span>
      </div>

      {/* Period filter */}
      <div className="flex gap-1 bg-bg-secondary rounded-lg p-1 w-fit">
        {periodButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              period === key
                ? 'bg-white text-text-primary shadow-card'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards row 1 */}
      {summaryLoading ? (
        <div className="flex justify-center py-4"><LoadingSpinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Study Today"
              value={formatDuration(summary?.studyToday ?? 0)}
              icon={<Clock size={18} />}
              color="#6976CC"
            />
            <StatCard
              label="Study This Week"
              value={formatDuration(summary?.studyWeek ?? 0)}
              icon={<TrendingUp size={18} />}
              color="#6976CC"
            />
            <StatCard
              label="Study This Month"
              value={formatDuration(summary?.studyMonth ?? 0)}
              icon={<BookOpen size={18} />}
              color="#626FC5"
            />
            <StatCard
              label="Active Subjects"
              value={String(summary?.subjectCount ?? 0)}
              icon={<Library size={18} />}
              color="#7B9ED9"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Topics"
              value={String(summary?.topicCount ?? 0)}
              icon={<Layers size={18} />}
              color="#929BB8"
            />
            <StatCard
              label="Completed"
              value={String(summary?.completedTopics ?? 0)}
              icon={<CheckCircle2 size={18} />}
              color="#5BA85B"
            />
            <StatCard
              label="In Progress"
              value={String(summary?.inProgressTopics ?? 0)}
              icon={<Activity size={18} />}
              color="#6976CC"
            />
            <StatCard
              label="Pending Tasks"
              value={String(summary?.pendingTasks ?? 0)}
              icon={<ListTodo size={18} />}
              color="#E98F91"
            />
          </div>
        </>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Study hours chart */}
        <div className="lg:col-span-2">
          <Card title="Study Hours" subtitle={`${periodButtons.find(p => p.key === period)?.label}`}>
            {studyLoading ? (
              <div className="flex justify-center h-48"><LoadingSpinner /></div>
            ) : chartData.length === 0 ? (
              <div className="h-48">
                <EmptyState
                  icon={<BookOpen size={32} className="text-lavender-light" />}
                  title="No study data yet"
                  description="Log your first study session to see trends here."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11, fill: '#929BB8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#929BB8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}h`}
                  />
                  <Tooltip content={<StudyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#6976CC"
                    strokeWidth={2}
                    fill="#D8DFFD"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Subject distribution */}
        <div>
          <Card title="Subjects">
            {subjectPieData.length === 0 ? (
              <div className="h-48">
                <EmptyState
                  icon={<Library size={32} className="text-lavender-light" />}
                  title="No subjects yet"
                  description="Add subjects to see distribution."
                />
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={subjectPieData}
                      dataKey="totalMinutes"
                      nameKey="subjectName"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                    >
                      {subjectPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.subjectColor || '#6976CC'} />
                      ))}
                    </Pie>
                    <Tooltip content={<SubjectTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {subjectPieData.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate mr-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.subjectColor || '#6976CC' }}
                        />
                        <span className="text-text-secondary truncate">{s.subjectName}</span>
                      </div>
                      <span className="text-text-primary font-medium flex-shrink-0">{formatDuration(s.totalMinutes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Productivity strip */}
      {activityData && activityData.stats.totalMinutes > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Activity Breakdown</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatDuration(activityData.stats.totalMinutes)} recorded · {Math.round(activityData.stats.productivityPercent)}% productive
              </p>
            </div>
            <Link to="/activity-log" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex rounded-full overflow-hidden h-3">
            {(['productive', 'neutral', 'distracting'] as const).map(key => {
              const mins = key === 'productive'
                ? activityData.stats.productiveMinutes
                : key === 'neutral'
                  ? activityData.stats.neutralMinutes
                  : activityData.stats.distractingMinutes
              const pct = activityData.stats.totalMinutes > 0
                ? (mins / activityData.stats.totalMinutes) * 100
                : 0
              return pct > 0 ? (
                <div
                  key={key}
                  style={{ width: `${pct}%`, backgroundColor: PRODUCTIVITY_COLORS[key] }}
                  title={`${key}: ${formatDuration(mins)}`}
                />
              ) : null
            })}
          </div>
          <div className="flex gap-4 mt-2">
            {Object.entries(PRODUCTIVITY_COLORS).map(([key, color]) => {
              const mins = key === 'productive'
                ? activityData.stats.productiveMinutes
                : key === 'neutral'
                  ? activityData.stats.neutralMinutes
                  : activityData.stats.distractingMinutes
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{key}</span>
                  <span className="font-medium text-text-primary">{formatDuration(mins)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent study sessions */}
        <Card
          title="Recent Study Sessions"
          actions={
            <Link to="/study-tracker" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          }
        >
          {!recentLogs || recentLogs.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} className="text-lavender-light" />}
              title="No study sessions yet"
              description="Log your first session to see it here."
              action={
                <Link to="/study-tracker" className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg">
                  Log Study Session
                </Link>
              }
            />
          ) : (
            <div className="space-y-0">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: log.subjectColor || '#6976CC' }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {log.subjectName}
                        {log.topicTitle && (
                          <span className="text-text-secondary font-normal"> · {log.topicTitle}</span>
                        )}
                      </p>
                      <p className="text-xs text-text-secondary">{formatDate(log.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary flex-shrink-0 ml-2">
                    {formatDuration(log.durationMinutes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming tasks */}
        <Card
          title="Upcoming Tasks"
          actions={
            <Link to="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          }
        >
          {!pendingTasks || pendingTasks.length === 0 ? (
            <EmptyState
              icon={<ListTodo size={28} className="text-lavender-light" />}
              title="No pending tasks"
              description="Add tasks to keep track of what needs to be done."
            />
          ) : (
            <div className="space-y-0">
              {pendingTasks.map((task) => {
                const overdue = task.dueDate && task.dueDate < today()
                return (
                  <div key={task.id} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#6976CC' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className={`text-xs mt-0.5 ${overdue ? 'text-coral-strong font-medium' : 'text-text-secondary'}`}>
                          {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded capitalize flex-shrink-0"
                      style={{
                        backgroundColor: PRIORITY_COLORS[task.priority] + '20',
                        color: PRIORITY_COLORS[task.priority],
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
