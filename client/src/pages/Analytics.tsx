import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart2, BookOpen, Activity, TrendingUp, Target } from 'lucide-react'

import {
  getStudyAnalytics, getSubjectAnalytics, getTopicAnalytics, getActivityAnalytics,
} from '@/services/analytics'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDuration, formatShortDate, nDaysAgo, today, startOfMonth, minutesToHours } from '@/utils/format'
import type { SubjectStudyTotal, TopicStudyTotal, CategoryBreakdown } from '@/types'

type Period = '7d' | '30d' | 'month' | '90d'
type Tab = 'study' | 'activity'

function getRange(period: Period): { startDate: string; endDate: string } {
  const t = today()
  switch (period) {
    case '7d':    return { startDate: nDaysAgo(6), endDate: t }
    case '30d':   return { startDate: nDaysAgo(29), endDate: t }
    case 'month': return { startDate: startOfMonth(), endDate: t }
    case '90d':   return { startDate: nDaysAgo(89), endDate: t }
  }
}

function daysInRange(period: Period): number {
  switch (period) {
    case '7d':    return 7
    case '30d':   return 30
    case 'month': return new Date().getDate()
    case '90d':   return 90
  }
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#5BA85B',
  in_progress: '#6976CC',
  not_started: '#C4C9E5',
}

const CLASS_COLORS: Record<string, string> = {
  productive: '#6976CC',
  neutral: '#C4C9E5',
  distracting: '#E98F91',
}

function DurationTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="text-text-secondary mb-1">{label ? formatShortDate(label) : ''}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatDuration(Math.round(p.value * 60))}
        </p>
      ))}
    </div>
  )
}

function SubjectTable({ subjects, total }: { subjects: SubjectStudyTotal[]; total: number }) {
  return (
    <div className="mt-3 divide-y divide-border">
      {subjects.map((s, i) => {
        const pct = total > 0 ? Math.round((s.totalMinutes / total) * 100) : 0
        return (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.subjectColor || '#6976CC' }} />
              <span className="text-sm text-text-primary truncate">{s.subjectName}</span>
            </div>
            <div className="flex items-center gap-3 ml-2 flex-shrink-0">
              <div className="w-20 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.subjectColor || '#6976CC' }} />
              </div>
              <span className="text-xs text-text-secondary w-8 text-right">{pct}%</span>
              <span className="text-sm font-medium text-text-primary w-14 text-right">{formatDuration(s.totalMinutes)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProductivityPulse({ productive, neutral, distracting, total }: {
  productive: number; neutral: number; distracting: number; total: number
}) {
  const pct = total > 0 ? Math.round((productive / total) * 100) : 0
  const pieData = [
    { name: 'Productive', value: productive, color: '#6976CC' },
    { name: 'Neutral', value: neutral, color: '#C4C9E5' },
    { name: 'Distracting', value: distracting, color: '#E98F91' },
  ].filter(d => d.value > 0)

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={pieData.length ? pieData : [{ name: 'Empty', value: 1, color: '#E5E8F0' }]}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">{pct}%</span>
          <span className="text-xs text-text-secondary">productive</span>
        </div>
      </div>
      <div className="space-y-3">
        {pieData.map(({ name, value, color }) => (
          <div key={name} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <p className="text-sm text-text-secondary">{name}</p>
              <p className="text-sm font-semibold text-text-primary">{formatDuration(value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('30d')
  const [tab, setTab] = useState<Tab>('study')
  const range = useMemo(() => getRange(period), [period])

  const { data: studyData, isLoading: studyLoading } = useQuery({
    queryKey: ['analytics', 'study', range],
    queryFn: () => getStudyAnalytics(range),
  })

  const { data: subjectData } = useQuery({
    queryKey: ['analytics', 'subjects', range],
    queryFn: () => getSubjectAnalytics(range),
  })

  const { data: topicData } = useQuery({
    queryKey: ['analytics', 'topics', range],
    queryFn: () => getTopicAnalytics(range),
    select: (data: TopicStudyTotal[]) => data.filter(t => t.totalMinutes > 0).slice(0, 10),
  })

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['analytics', 'activity', range],
    queryFn: () => getActivityAnalytics(range),
  })

  const chartData = useMemo(() => {
    return (studyData?.daily ?? []).map(d => ({
      date: d.date,
      hours: Math.round((d.minutes / 60) * 10) / 10,
    }))
  }, [studyData])

  const topicChartData = useMemo(() => {
    return (topicData ?? []).map(t => ({
      name: t.topicTitle.length > 22 ? t.topicTitle.slice(0, 22) + '…' : t.topicTitle,
      fullName: t.topicTitle,
      hours: Math.round((t.totalMinutes / 60) * 10) / 10,
      status: t.status,
    })).reverse()
  }, [topicData])

  const totalSubjectMinutes = useMemo(
    () => (subjectData ?? []).reduce((a, s) => a + s.totalMinutes, 0),
    [subjectData],
  )

  const avgDaily = studyData && studyData.totalMinutes > 0
    ? Math.round(studyData.totalMinutes / daysInRange(period))
    : 0

  const periodButtons: { key: Period; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'month', label: 'This Month' },
    { key: '90d', label: '3 Months' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">Analytics</h1>

        {/* Period filter */}
        <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
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
      </div>

      {/* Tab selector */}
      <div className="flex border-b border-border">
        {([['study', 'Study Analytics', <BookOpen size={15} />], ['activity', 'Activity Analytics', <Activity size={15} />]] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* STUDY TAB */}
      {tab === 'study' && (
        <div className="space-y-4">
          {studyLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : (
            <>
              {/* Study stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Study Time"
                  value={formatDuration(studyData?.totalMinutes ?? 0)}
                  icon={<BookOpen size={18} />}
                  color="#6976CC"
                />
                <StatCard
                  label="Daily Average"
                  value={formatDuration(avgDaily)}
                  icon={<TrendingUp size={18} />}
                  color="#626FC5"
                />
                <StatCard
                  label="Top Subject"
                  value={subjectData?.[0]?.subjectName ?? '—'}
                  icon={<Target size={18} />}
                  color="#7B9ED9"
                />
                <StatCard
                  label="Active Topics"
                  value={String(topicData?.length ?? 0)}
                  icon={<BarChart2 size={18} />}
                  color="#929BB8"
                />
              </div>

              {/* Study over time */}
              <Card title="Study Hours Over Time">
                {chartData.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen size={32} className="text-lavender-light" />}
                    title="No study data in this period"
                    description="Log study sessions to see trends."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 11, fill: '#929BB8' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#929BB8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}h`}
                      />
                      <Tooltip content={<DurationTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        name="Study"
                        stroke="#6976CC"
                        strokeWidth={2}
                        fill="#D8DFFD"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Subject distribution */}
              {(subjectData ?? []).length > 0 && (
                <Card title="Subject Distribution">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={subjectData!.filter(s => s.totalMinutes > 0)}
                          dataKey="totalMinutes"
                          nameKey="subjectName"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                        >
                          {subjectData!.filter(s => s.totalMinutes > 0).map((entry, i) => (
                            <Cell key={i} fill={entry.subjectColor || '#6976CC'} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [formatDuration(v), '']}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E8F0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <SubjectTable subjects={subjectData!.filter(s => s.totalMinutes > 0)} total={totalSubjectMinutes} />
                  </div>
                </Card>
              )}

              {/* Topic progress */}
              {topicChartData.length > 0 && (
                <Card title="Topic Study Time">
                  <ResponsiveContainer width="100%" height={Math.max(180, topicChartData.length * 28)}>
                    <BarChart
                      data={topicChartData}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#929BB8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}h`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#929BB8' }}
                        axisLine={false}
                        tickLine={false}
                        width={130}
                      />
                      <Tooltip
                        formatter={(v: number, _n: string, props: any) => [
                          formatDuration(Math.round(v * 60)),
                          props.payload?.fullName,
                        ]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E8F0' }}
                      />
                      <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                        {topicChartData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6976CC'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 flex-wrap">
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                      <div key={status} className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === 'activity' && (
        <div className="space-y-4">
          {activityLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !activityData || activityData.stats.totalMinutes === 0 ? (
            <EmptyState
              icon={<Activity size={40} className="text-lavender-light" />}
              title="No activity data in this period"
              description="Log activities to see your productivity breakdown."
            />
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Recorded" value={formatDuration(activityData.stats.totalMinutes)} icon={<Activity size={18} />} color="#929BB8" />
                <StatCard label="Productive" value={formatDuration(activityData.stats.productiveMinutes)} icon={<TrendingUp size={18} />} color="#6976CC" />
                <StatCard label="Neutral" value={formatDuration(activityData.stats.neutralMinutes)} icon={<Target size={18} />} color="#C4C9E5" />
                <StatCard label="Distracting" value={formatDuration(activityData.stats.distractingMinutes)} icon={<BarChart2 size={18} />} color="#E98F91" />
              </div>

              {/* Productivity pulse */}
              <Card title="Productivity Breakdown">
                <ProductivityPulse
                  productive={activityData.stats.productiveMinutes}
                  neutral={activityData.stats.neutralMinutes}
                  distracting={activityData.stats.distractingMinutes}
                  total={activityData.stats.totalMinutes}
                />
              </Card>

              {/* Category breakdown */}
              {activityData.breakdown.length > 0 && (
                <Card title="By Category">
                  <ResponsiveContainer width="100%" height={Math.max(160, activityData.breakdown.length * 28)}>
                    <BarChart
                      data={activityData.breakdown.map(c => ({
                        name: c.categoryName,
                        hours: Math.round((c.totalMinutes / 60) * 10) / 10,
                        color: c.color || CLASS_COLORS[c.classification] || '#C4C9E5',
                        classification: c.classification,
                      }))}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#929BB8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}h`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#929BB8' }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip
                        formatter={(v: number) => [formatDuration(Math.round(v * 60)), '']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E8F0' }}
                      />
                      <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                        {activityData.breakdown.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.color || CLASS_COLORS[entry.classification] || '#C4C9E5'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
