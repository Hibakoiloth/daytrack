import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Lock, X } from 'lucide-react'
import { getActivityLogs, createActivityLog, updateActivityLog, deleteActivityLog } from '@/services/activityLogs'
import { getActivityCategories, createActivityCategory, updateActivityCategory, deleteActivityCategory } from '@/services/activityCategories'
import { getActivityAnalytics } from '@/services/analytics'
import type { ActivityLog as IActivityLog, ActivityCategory } from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDuration, formatDate, today, yesterday, nDaysAgo, startOfMonth } from '@/utils/format'

const CLASS_STYLES: Record<string, string> = {
  productive: 'bg-lavender-pale text-primary',
  neutral: 'bg-bg-secondary text-text-secondary',
  distracting: 'bg-red-50 text-coral-strong',
}

const CLASS_COLORS: Record<string, string> = {
  productive: '#6976CC',
  neutral: '#C4C9E5',
  distracting: '#E98F91',
}

const PRESET_COLORS = ['#6976CC','#626FC5','#5BA85B','#7B9ED9','#F5A623','#E98F91','#E4484B','#929BB8','#7ED321','#C4C9E5']

type DatePeriod = 'today' | 'week' | 'month' | 'all'

function getDateRange(period: DatePeriod): { startDate?: string; endDate?: string } {
  const t = today()
  if (period === 'today') return { startDate: t, endDate: t }
  if (period === 'week') return { startDate: nDaysAgo(6), endDate: t }
  if (period === 'month') return { startDate: startOfMonth(), endDate: t }
  return {}
}

// ─── Category Manager Modal ────────────────────────────────────────────────
interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const qc = useQueryClient()
  const { data: categories = [] } = useQuery({ queryKey: ['activity-categories'], queryFn: getActivityCategories })
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', classification: 'neutral', color: '#929BB8' })
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const createMut = useMutation({
    mutationFn: createActivityCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-categories'] }); setAdding(false); setForm({ name: '', classification: 'neutral', color: '#929BB8' }) }
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ActivityCategory> }) => updateActivityCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-categories'] }); setEditId(null) }
  })

  const deleteMut = useMutation({
    mutationFn: deleteActivityCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-categories'] }); setDeleteTarget(null) }
  })

  const target = categories.find(c => c.id === deleteTarget)

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories" size="lg">
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-main">
              {editId === cat.id ? (
                <div className="flex-1 flex gap-2 flex-wrap items-end">
                  <input className="input flex-1 min-w-0" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
                  <select className="input w-36" value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))}>
                    <option value="productive">Productive</option>
                    <option value="neutral">Neutral</option>
                    <option value="distracting">Distracting</option>
                  </select>
                  <input type="color" className="w-9 h-9 rounded border border-border cursor-pointer p-0.5" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                  <Button size="sm" onClick={() => updateMut.mutate({ id: cat.id, data: { name: form.name, classification: form.classification as ActivityCategory['classification'], color: form.color } })}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full flex-shrink-0 border border-border" style={{ background: cat.color || CLASS_COLORS[cat.classification] }} />
                  <span className="flex-1 text-sm text-text-primary font-medium">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLASS_STYLES[cat.classification]}`}>{cat.classification}</span>
                  <button className="p-1 text-text-secondary hover:text-primary rounded" onClick={() => { setEditId(cat.id); setForm({ name: cat.name, classification: cat.classification, color: cat.color || '#929BB8' }) }}>
                    <Pencil size={14} />
                  </button>
                  {cat.isDefault ? (
                    <span className="p-1 text-text-secondary opacity-40"><Lock size={14} /></span>
                  ) : (
                    <button className="p-1 text-text-secondary hover:text-coral-strong rounded" onClick={() => setDeleteTarget(cat.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {adding ? (
            <div className="flex gap-2 flex-wrap items-end pt-2">
              <input className="input flex-1 min-w-0" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
              <select className="input w-36" value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))}>
                <option value="productive">Productive</option>
                <option value="neutral">Neutral</option>
                <option value="distracting">Distracting</option>
              </select>
              <input type="color" className="w-9 h-9 rounded border border-border cursor-pointer p-0.5" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              <Button size="sm" onClick={() => createMut.mutate({ name: form.name, classification: form.classification as ActivityCategory['classification'], color: form.color })}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          ) : (
            <button className="flex items-center gap-2 text-sm text-primary font-medium mt-2 px-2 py-1.5 rounded hover:bg-bg-secondary transition-colors" onClick={() => setAdding(true)}>
              <Plus size={14} /> New Category
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget)}
        title="Delete Category"
        message={`Delete "${target?.name}"? Activity logs using this category will keep the log but lose the category.`}
      />
    </>
  )
}

// ─── Activity Log Form ─────────────────────────────────────────────────────
interface LogFormProps {
  isOpen: boolean
  onClose: () => void
  editing?: IActivityLog | null
  categories: ActivityCategory[]
}

function ActivityLogForm({ isOpen, onClose, editing, categories }: LogFormProps) {
  const qc = useQueryClient()
  const [activityName, setActivityName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(today())
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (editing) {
      setActivityName(editing.activityName)
      setCategoryId(editing.categoryId ? String(editing.categoryId) : '')
      setDate(editing.date)
      setHours(Math.floor(editing.durationMinutes / 60))
      setMinutes(editing.durationMinutes % 60)
      setNotes(editing.notes || '')
    } else {
      setActivityName(''); setCategoryId(''); setDate(today()); setHours(0); setMinutes(0); setNotes('')
    }
    setError('')
  }, [editing, isOpen])

  const saveMut = useMutation({
    mutationFn: (data: Partial<IActivityLog>) =>
      editing ? updateActivityLog(editing.id, data) : createActivityLog(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-logs'] })
      qc.invalidateQueries({ queryKey: ['activity-analytics'] })
      onClose()
    }
  })

  function handleSave() {
    if (!activityName.trim()) return setError('Activity name is required')
    const duration = hours * 60 + minutes
    if (duration === 0) return setError('Duration must be greater than 0')
    setError('')
    saveMut.mutate({
      activityName: activityName.trim(),
      categoryId: categoryId ? Number(categoryId) : undefined,
      date,
      durationMinutes: duration,
      notes: notes.trim() || undefined,
    })
  }

  const catOptions = [
    { value: '', label: 'No category' },
    ...categories.map(c => ({ value: String(c.id), label: c.name }))
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Activity' : 'Log Activity'}>
      <div className="space-y-4">
        {error && <p className="text-sm text-coral-strong bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Input label="Activity Name *" value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="e.g. Morning run, Deep work session" />
        <Select label="Category" value={categoryId} onChange={e => setCategoryId(e.target.value)} options={catOptions} />
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Date *</label>
          <div className="flex gap-2 mb-2">
            <button type="button" className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${date === today() ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:bg-bg-secondary'}`} onClick={() => setDate(today())}>Today</button>
            <button type="button" className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${date === yesterday() ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:bg-bg-secondary'}`} onClick={() => setDate(yesterday())}>Yesterday</button>
          </div>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} max={today()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Duration *</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={23} className="input text-center" value={hours} onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))} />
                <span className="text-sm text-text-secondary">hrs</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={59} className="input text-center" value={minutes} onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} />
                <span className="text-sm text-text-secondary">min</span>
              </div>
            </div>
          </div>
        </div>
        <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMut.isPending}>{editing ? 'Save Changes' : 'Log Activity'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const qc = useQueryClient()
  const [period, setPeriod] = useState<DatePeriod>('week')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IActivityLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IActivityLog | null>(null)
  const [showCatManager, setShowCatManager] = useState(false)

  const dateRange = getDateRange(period)

  const { data: categories = [] } = useQuery({ queryKey: ['activity-categories'], queryFn: getActivityCategories })
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', period, categoryFilter],
    queryFn: () => getActivityLogs({ ...dateRange, categoryId: categoryFilter ? Number(categoryFilter) : undefined })
  })
  const { data: analyticsData } = useQuery({
    queryKey: ['activity-analytics', period],
    queryFn: () => getActivityAnalytics(dateRange)
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteActivityLog(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-logs'] }); qc.invalidateQueries({ queryKey: ['activity-analytics'] }); setDeleteTarget(null) }
  })

  const filtered = useMemo(() => {
    if (!search) return logs
    const s = search.toLowerCase()
    return logs.filter(l => l.activityName.toLowerCase().includes(s) || l.categoryName?.toLowerCase().includes(s))
  }, [logs, search])

  const stats = analyticsData?.stats
  const totalMin = stats?.totalMinutes || 0
  const prodMin = stats?.productiveMinutes || 0
  const neutMin = stats?.neutralMinutes || 0
  const distMin = stats?.distractingMinutes || 0

  const catOptions = [
    { value: '', label: 'All categories' },
    ...categories.map(c => ({ value: String(c.id), label: c.name }))
  ]

  const periodLabels: Record<DatePeriod, string> = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Activity Log</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCatManager(true)}>Manage Categories</Button>
          <Button icon={<Plus size={15} />} onClick={() => { setEditing(null); setShowForm(true) }}>Log Activity</Button>
        </div>
      </div>

      {/* Productivity Summary */}
      {totalMin > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Recorded Time ({periodLabels[period]})</p>
              <p className="text-2xl font-bold text-text-primary">{formatDuration(totalMin)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Productivity</p>
              <p className="text-2xl font-bold text-primary">{stats?.productivityPercent.toFixed(0) || 0}%</p>
            </div>
          </div>
          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-3 bg-bg-secondary">
            {prodMin > 0 && <div className="h-full transition-all" style={{ width: `${(prodMin / totalMin) * 100}%`, background: '#6976CC' }} />}
            {neutMin > 0 && <div className="h-full transition-all" style={{ width: `${(neutMin / totalMin) * 100}%`, background: '#C4C9E5' }} />}
            {distMin > 0 && <div className="h-full transition-all" style={{ width: `${(distMin / totalMin) * 100}%`, background: '#E98F91' }} />}
          </div>
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#6976CC' }} /><span className="text-xs text-text-secondary">Productive <strong className="text-text-primary">{formatDuration(prodMin)}</strong></span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#C4C9E5' }} /><span className="text-xs text-text-secondary">Neutral <strong className="text-text-primary">{formatDuration(neutMin)}</strong></span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#E98F91' }} /><span className="text-xs text-text-secondary">Distracting <strong className="text-text-primary">{formatDuration(distMin)}</strong></span></div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-1 bg-bg-main rounded-lg p-1">
            {(['today','week','month','all'] as DatePeriod[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <div className="w-48">
            <select className="input text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <input className="input flex-1 min-w-32 text-sm" placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl">📋</span>}
            title="No activities found"
            description="No activities logged yet. Start recording how you spend your time."
            action={<Button icon={<Plus size={15} />} onClick={() => { setEditing(null); setShowForm(true) }}>Log Activity</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Activity</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Category</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Duration</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">Notes</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg-main transition-colors">
                    <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">{formatDate(log.date)}</td>
                    <td className="py-2.5 px-3 text-text-primary font-medium">{log.activityName}</td>
                    <td className="py-2.5 px-3">
                      {log.categoryName && log.categoryClassification ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLASS_STYLES[log.categoryClassification] || 'bg-bg-secondary text-text-secondary'}`}>
                          {log.categoryName}
                        </span>
                      ) : <span className="text-text-secondary text-xs">—</span>}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-primary whitespace-nowrap">{formatDuration(log.durationMinutes)}</td>
                    <td className="py-2.5 px-3 text-text-secondary max-w-xs truncate">{log.notes || '—'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditing(log); setShowForm(true) }} className="p-1.5 rounded hover:bg-bg-secondary text-text-secondary hover:text-primary transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteTarget(log)} className="p-1.5 rounded hover:bg-red-50 text-text-secondary hover:text-coral-strong transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-text-secondary text-right mt-3 px-3">{filtered.length} record{filtered.length !== 1 ? 's' : ''} · Total: <strong>{formatDuration(filtered.reduce((s, l) => s + l.durationMinutes, 0))}</strong></p>
          </div>
        )}
      </Card>

      <ActivityLogForm isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null) }} editing={editing} categories={categories} />
      <CategoryManager isOpen={showCatManager} onClose={() => setShowCatManager(false)} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete Activity Log"
        message={`Delete "${deleteTarget?.activityName}" (${formatDuration(deleteTarget?.durationMinutes || 0)})? This cannot be undone.`}
      />
    </div>
  )
}
