import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, BookOpen, Search, Clock } from 'lucide-react'
import type { StudyLog } from '@/types'
import { getSubjects } from '@/services/subjects'
import { getTopics } from '@/services/topics'
import { getStudyLogs, createStudyLog, updateStudyLog, deleteStudyLog } from '@/services/studyLogs'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDuration, formatDate, today, yesterday, nDaysAgo, startOfMonth } from '@/utils/format'

function getDateRange(period: 'today' | 'week' | 'month' | 'all') {
  switch (period) {
    case 'today': return { startDate: today(), endDate: today() }
    case 'week': return { startDate: nDaysAgo(6), endDate: today() }
    case 'month': return { startDate: startOfMonth(), endDate: today() }
    default: return {}
  }
}

interface LogFormProps {
  isOpen: boolean
  onClose: () => void
  editLog?: StudyLog
}

function StudyLogForm({ isOpen, onClose, editLog }: LogFormProps) {
  const queryClient = useQueryClient()
  const [subjectId, setSubjectId] = useState(editLog ? String(editLog.subjectId) : '')
  const [topicId, setTopicId] = useState(editLog?.topicId ? String(editLog.topicId) : '')
  const [date, setDate] = useState(editLog?.date ?? today())
  const [hours, setHours] = useState(editLog ? Math.floor(editLog.durationMinutes / 60) : 0)
  const [minutes, setMinutes] = useState(editLog ? editLog.durationMinutes % 60 : 0)
  const [notes, setNotes] = useState(editLog?.notes ?? '')
  const [error, setError] = useState('')

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics-for-subject', subjectId],
    queryFn: () => getTopics({ subjectId: parseInt(subjectId) }),
    enabled: !!subjectId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['study-logs'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    queryClient.invalidateQueries({ queryKey: ['subjects'] })
  }

  const createMutation = useMutation({
    mutationFn: createStudyLog,
    onSuccess: () => { invalidate(); onClose() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudyLog> }) => updateStudyLog(id, data),
    onSuccess: () => { invalidate(); onClose() },
  })

  const handleSubjectChange = (val: string) => { setSubjectId(val); setTopicId('') }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId) { setError('Please select a subject'); return }
    if (!date) { setError('Please enter a date'); return }
    const total = hours * 60 + minutes
    if (total <= 0) { setError('Duration must be greater than 0'); return }
    setError('')
    const payload = {
      subjectId: parseInt(subjectId),
      topicId: topicId ? parseInt(topicId) : undefined,
      date,
      durationMinutes: total,
      notes: notes.trim() || undefined,
    }
    if (editLog) updateMutation.mutate({ id: editLog.id, data: payload })
    else createMutation.mutate(payload)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const topicOptions = [
    { value: '', label: 'No specific topic' },
    ...topics.map(t => ({ value: String(t.id), label: t.title })),
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editLog ? 'Edit Study Session' : 'Log Study Session'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Subject <span className="text-coral-strong">*</span></label>
          <select value={subjectId} onChange={e => handleSubjectChange(e.target.value)} className="input">
            <option value="">Select subject...</option>
            {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          {error && !subjectId && <p className="text-xs text-coral-strong mt-1">{error}</p>}
        </div>

        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Topic <span className="text-xs font-normal text-text-secondary">(optional)</span>
          </label>
          {!subjectId ? (
            <p className="text-sm text-text-secondary py-1.5 px-3 bg-bg-secondary rounded-lg">Select a subject first</p>
          ) : topicsLoading ? (
            <div className="flex items-center gap-2 text-text-secondary text-sm py-2"><LoadingSpinner size="sm" /> Loading topics…</div>
          ) : (
            <select value={topicId} onChange={e => setTopicId(e.target.value)} className="input">
              {topicOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Date <span className="text-coral-strong">*</span></label>
          <div className="flex items-center gap-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today()} className="input flex-1" />
            <button type="button" onClick={() => setDate(today())}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors whitespace-nowrap ${date === today() ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
              Today
            </button>
            <button type="button" onClick={() => setDate(yesterday())}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors whitespace-nowrap ${date === yesterday() ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
              Yesterday
            </button>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Duration <span className="text-coral-strong">*</span></label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-secondary mb-1 block">Hours</label>
              <input type="number" min={0} max={23} value={hours}
                onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="input text-center" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-secondary mb-1 block">Minutes</label>
              <input type="number" min={0} max={59} value={minutes}
                onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="input text-center" />
            </div>
            {(hours > 0 || minutes > 0) && (
              <div className="flex-shrink-0 text-sm font-semibold text-primary mt-5">
                {formatDuration(hours * 60 + minutes)}
              </div>
            )}
          </div>
          {error && hours === 0 && minutes === 0 && <p className="text-xs text-coral-strong mt-1">Duration must be greater than 0</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Notes <span className="text-xs font-normal text-text-secondary">(optional)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="What did you study? Any reflections…" className="input resize-none" />
        </div>

        {error && subjectId && (hours > 0 || minutes > 0) && <p className="text-sm text-coral-strong">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Saving…' : editLog ? 'Update Session' : 'Save Session'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function StudyTracker() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editLog, setEditLog] = useState<StudyLog | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })

  const apiFilters = useMemo(() => ({
    subjectId: filterSubject ? parseInt(filterSubject) : undefined,
    ...getDateRange(filterPeriod),
  }), [filterSubject, filterPeriod])

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['study-logs', apiFilters],
    queryFn: () => getStudyLogs(apiFilters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudyLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-logs'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setDeleteId(null)
    },
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(l =>
      l.subjectName?.toLowerCase().includes(q) ||
      l.topicTitle?.toLowerCase().includes(q) ||
      l.notes?.toLowerCase().includes(q)
    )
  }, [logs, search])

  const totalMinutes = filtered.reduce((s, l) => s + l.durationMinutes, 0)
  const avgMinutes = filtered.length ? Math.round(totalMinutes / filtered.length) : 0

  const openEdit = (log: StudyLog) => { setEditLog(log); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditLog(undefined) }

  const periodButtons: { value: typeof filterPeriod; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: '7 Days' },
    { value: 'month', label: 'Month' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Study Tracker</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manually log your study sessions</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} size="lg"
          onClick={() => { setEditLog(undefined); setShowForm(true) }}>
          Log Study Session
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Time', value: formatDuration(totalMinutes), icon: <Clock size={18} className="text-primary" /> },
          { label: 'Sessions', value: String(filtered.length), icon: <BookOpen size={18} className="text-primary" /> },
          { label: 'Avg Session', value: formatDuration(avgMinutes), icon: <Clock size={18} className="text-primary" /> },
        ].map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-lavender-pale flex items-center justify-center flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions…" className="input pl-8 text-sm" />
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="input w-auto min-w-[160px] text-sm">
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {periodButtons.map(b => (
            <button key={b.value} onClick={() => setFilterPeriod(b.value)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${filterPeriod === b.value ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-bg-secondary'}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner size="md" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={32} className="text-lavender-light" />}
            title="No study sessions yet"
            description="Log your first study session to get started"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Log Study Session</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Date', 'Subject', 'Topic', 'Duration', 'Notes', ''].map(h => (
                      <th key={h} className={`text-left text-xs font-semibold text-text-secondary pb-3 ${h ? 'pr-4' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(log => (
                    <tr key={log.id} className="hover:bg-bg-main transition-colors">
                      <td className="py-3 pr-4 text-sm text-text-primary whitespace-nowrap">{formatDate(log.date)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: log.subjectColor || '#6976CC' }} />
                          <span className="text-sm text-text-primary">{log.subjectName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-text-secondary">{log.topicTitle || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold text-primary">{formatDuration(log.durationMinutes)}</span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-text-secondary max-w-xs">
                        {log.notes ? (
                          <span title={log.notes} className="truncate block">
                            {log.notes.length > 60 ? log.notes.slice(0, 60) + '…' : log.notes}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(log)}
                            className="p-1.5 rounded hover:bg-lavender-pale text-text-secondary hover:text-primary transition-colors" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteId(log.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-text-secondary hover:text-coral-strong transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <span className="text-sm text-text-secondary">
                {filtered.length} session{filtered.length !== 1 ? 's' : ''} · Total:{' '}
                <span className="font-semibold text-text-primary">{formatDuration(totalMinutes)}</span>
              </span>
            </div>
          </>
        )}
      </Card>

      <StudyLogForm isOpen={showForm} onClose={closeForm} editLog={editLog} />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId) }}
        title="Delete Study Session"
        message="Are you sure you want to delete this study session? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
