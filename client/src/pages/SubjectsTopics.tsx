import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, BookOpen, Library, ChevronRight, CheckCircle2, Circle, AlertCircle, ArrowLeft, Clock, Target } from 'lucide-react'
import type { Subject, Topic, StudyLog } from '@/types'
import { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } from '@/services/subjects'
import { getTopics, createTopic, updateTopic, deleteTopic } from '@/services/topics'
import { getStudyLogs } from '@/services/studyLogs'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDuration, formatDate, isOverdue, isDueSoon, today } from '@/utils/format'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_SWATCHES = ['#6976CC','#626FC5','#E4484B','#E98F91','#5BA85B','#F5A623','#7B9ED9','#C4C9E5','#E8844A','#929BB8']

const STATUS_MAP = {
  not_started: { label: 'Not Started', color: 'text-text-secondary', bg: 'bg-bg-secondary' },
  in_progress: { label: 'In Progress', color: 'text-primary', bg: 'bg-lavender-pale' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50' },
}

const PRIORITY_MAP = {
  low: { label: 'Low', classes: 'bg-bg-secondary text-text-secondary' },
  medium: { label: 'Medium', classes: 'bg-yellow-50 text-yellow-700' },
  high: { label: 'High', classes: 'bg-red-50 text-coral-strong' },
}

function StatusIcon({ status }: { status: Topic['status'] }) {
  if (status === 'completed') return <CheckCircle2 size={16} className="text-green-600" />
  if (status === 'in_progress') return <BookOpen size={16} className="text-primary" />
  return <Circle size={16} className="text-text-secondary" />
}

// ─── Subject Form ─────────────────────────────────────────────────────────────

interface SubjectFormProps {
  isOpen: boolean
  onClose: () => void
  editSubject?: Subject
}

function SubjectForm({ isOpen, onClose, editSubject }: SubjectFormProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(editSubject?.name ?? '')
  const [description, setDescription] = useState(editSubject?.description ?? '')
  const [color, setColor] = useState(editSubject?.color ?? '#6976CC')
  const [error, setError] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['subjects'] })
  }

  const createMutation = useMutation({ mutationFn: createSubject, onSuccess: () => { invalidate(); onClose() } })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subject> }) => updateSubject(id, data),
    onSuccess: () => { invalidate(); onClose() },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setError('')
    if (editSubject) updateMutation.mutate({ id: editSubject.id, data: { name: name.trim(), description: description.trim() || undefined, color } })
    else createMutation.mutate({ name: name.trim(), description: description.trim() || undefined, color } as Partial<Subject>)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editSubject ? 'Edit Subject' : 'New Subject'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Name <span className="text-coral-strong">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Artificial Intelligence" className="input" autoFocus />
          {error && <p className="text-xs text-coral-strong mt-1">{error}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Description <span className="text-xs font-normal text-text-secondary">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What is this subject about?" className="input resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_SWATCHES.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-text-primary' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isPending}>{isPending ? 'Saving…' : editSubject ? 'Update' : 'Create Subject'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Topic Form ───────────────────────────────────────────────────────────────

interface TopicFormProps {
  isOpen: boolean
  onClose: () => void
  subjectId: number
  editTopic?: Topic
}

function TopicForm({ isOpen, onClose, subjectId, editTopic }: TopicFormProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(editTopic?.title ?? '')
  const [description, setDescription] = useState(editTopic?.description ?? '')
  const [status, setStatus] = useState<Topic['status']>(editTopic?.status ?? 'not_started')
  const [priority, setPriority] = useState(editTopic?.priority ?? '')
  const [deadline, setDeadline] = useState(editTopic?.deadline ?? '')
  const [targetHours, setTargetHours] = useState(editTopic?.targetHours ? String(editTopic.targetHours) : '')
  const [error, setError] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['topics'] })
    queryClient.invalidateQueries({ queryKey: ['subjects'] })
  }

  const createMutation = useMutation({ mutationFn: createTopic, onSuccess: () => { invalidate(); onClose() } })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Topic> }) => updateTopic(id, data),
    onSuccess: () => { invalidate(); onClose() },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    const payload: Partial<Topic> = {
      subjectId,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority: priority as Topic['priority'] || undefined,
      deadline: deadline || undefined,
      targetHours: targetHours ? parseFloat(targetHours) : undefined,
    }
    if (editTopic) updateMutation.mutate({ id: editTopic.id, data: payload })
    else createMutation.mutate(payload)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTopic ? 'Edit Topic' : 'New Topic'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Title <span className="text-coral-strong">*</span></label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Transformer Architecture" className="input" autoFocus />
          {error && <p className="text-xs text-coral-strong mt-1">{error}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Description <span className="text-xs font-normal text-text-secondary">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does this topic cover?" className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Topic['status'])} className="input">
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Priority <span className="text-xs font-normal text-text-secondary">(optional)</span></label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input">
              <option value="">No priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Deadline <span className="text-xs font-normal text-text-secondary">(optional)</span></label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Target Hours <span className="text-xs font-normal text-text-secondary">(optional)</span></label>
            <input type="number" min={0} step={0.5} value={targetHours} onChange={e => setTargetHours(e.target.value)} placeholder="e.g. 10" className="input" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isPending}>{isPending ? 'Saving…' : editTopic ? 'Update' : 'Create Topic'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Topic Detail Modal ───────────────────────────────────────────────────────

interface TopicDetailProps {
  topic: Topic | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

function TopicDetail({ topic, isOpen, onClose, onEdit }: TopicDetailProps) {
  const { data: logs = [] } = useQuery({
    queryKey: ['study-logs', { topicId: topic?.id }],
    queryFn: () => getStudyLogs({ topicId: topic!.id }),
    enabled: !!topic,
  })

  if (!topic) return null
  const totalMinutes = logs.reduce((s, l) => s + l.durationMinutes, 0)
  const status = STATUS_MAP[topic.status]
  const targetMinutes = topic.targetHours ? topic.targetHours * 60 : 0
  const progress = targetMinutes > 0 ? Math.min(100, Math.round((totalMinutes / targetMinutes) * 100)) : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={topic.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.color}`}>{status.label}</span>
          {topic.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_MAP[topic.priority].classes}`}>
              {PRIORITY_MAP[topic.priority].label} Priority
            </span>
          )}
          {topic.deadline && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${isOverdue(topic.deadline) ? 'bg-red-50 text-coral-strong' : isDueSoon(topic.deadline) ? 'bg-yellow-50 text-yellow-700' : 'bg-bg-secondary text-text-secondary'}`}>
              {isOverdue(topic.deadline) && <AlertCircle size={10} />}
              Due {formatDate(topic.deadline)}
            </span>
          )}
        </div>

        {topic.description && <p className="text-sm text-text-secondary">{topic.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-lavender-pale rounded-lg p-3">
            <p className="text-xs text-text-secondary mb-0.5">Total Studied</p>
            <p className="text-base font-bold text-primary">{formatDuration(totalMinutes)}</p>
          </div>
          {topic.targetHours && (
            <div className="bg-lavender-pale rounded-lg p-3">
              <p className="text-xs text-text-secondary mb-0.5">Target</p>
              <p className="text-base font-bold text-primary">{topic.targetHours}h</p>
            </div>
          )}
        </div>

        {targetMinutes > 0 && (
          <div>
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="h-2 bg-lavender-light rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Study History</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {logs.slice(0, 10).map(l => (
                <div key={l.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-bg-secondary">
                  <span className="text-text-secondary">{formatDate(l.date)}</span>
                  <span className="font-medium text-primary">{formatDuration(l.durationMinutes)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" icon={<Edit2 size={14} />} onClick={() => { onClose(); onEdit() }}>Edit Topic</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Subject List View ────────────────────────────────────────────────────────

function SubjectListView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); setDeleteId(null) },
  })

  const openEdit = (s: Subject) => { setEditSubject(s); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditSubject(undefined) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Subjects & Topics</h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => { setEditSubject(undefined); setShowForm(true) }}>
          New Subject
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="md" /></div>
      ) : subjects.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Library size={36} className="text-lavender-light" />}
            title="No subjects yet"
            description="Create your first subject to start organising your learning"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Create Subject</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-card border border-border overflow-hidden hover:shadow-card-hover transition-shadow">
              <div className="h-2" style={{ backgroundColor: s.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <h3 className="font-semibold text-text-primary truncate">{s.name}</h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(s)}
                      className="p-1 rounded hover:bg-lavender-pale text-text-secondary hover:text-primary transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteId(s.id)}
                      className="p-1 rounded hover:bg-red-50 text-text-secondary hover:text-coral-strong transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {s.description && (
                  <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{s.description}</p>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(s.totalMinutes ?? 0)}</span>
                  <span>{s.topicCount ?? 0} topics</span>
                  <span className="text-green-600">{s.completedTopics ?? 0} done</span>
                </div>

                <Link to={`/subjects/${s.id}`}
                  className="mt-3 flex items-center justify-between text-xs font-medium text-primary hover:text-primary-dark transition-colors group">
                  <span>View Topics</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubjectForm isOpen={showForm} onClose={closeForm} editSubject={editSubject} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId) }}
        title="Delete Subject"
        message="This will permanently delete the subject and all its topics. Study logs will be kept. This cannot be undone."
        confirmLabel="Delete Subject"
        variant="danger"
      />
    </div>
  )
}

// ─── Subject Detail View ──────────────────────────────────────────────────────

function SubjectDetailView({ id }: { id: number }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'topics' | 'history'>('topics')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState(false)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [editTopic, setEditTopic] = useState<Topic | undefined>(undefined)
  const [viewTopic, setViewTopic] = useState<Topic | null>(null)
  const [deleteTopicId, setDeleteTopicId] = useState<number | null>(null)

  const { data: subject, isLoading: subjectLoading } = useQuery({
    queryKey: ['subjects', id],
    queryFn: () => getSubject(id),
  })

  const { data: allTopics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics', id],
    queryFn: () => getTopics({ subjectId: id }),
  })

  const { data: studyLogs = [] } = useQuery({
    queryKey: ['study-logs', { subjectId: id }],
    queryFn: () => getStudyLogs({ subjectId: id }),
    enabled: tab === 'history',
  })

  const deleteSubjectMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); navigate('/subjects') },
  })

  const deleteTopicMutation = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['topics'] }); queryClient.invalidateQueries({ queryKey: ['subjects'] }); setDeleteTopicId(null) },
  })

  const topics = allTopics.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  if (subjectLoading) return <div className="flex items-center justify-center py-16"><LoadingSpinner size="md" /></div>
  if (!subject) return <div className="py-12 text-center text-text-secondary">Subject not found</div>

  const inProgress = allTopics.filter(t => t.status === 'in_progress').length
  const completed = allTopics.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <Link to="/subjects" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-3">
          <ArrowLeft size={14} /> Subjects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
            <div>
              <h1 className="text-xl font-bold text-text-primary">{subject.name}</h1>
              {subject.description && <p className="text-sm text-text-secondary mt-0.5">{subject.description}</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" icon={<Edit2 size={13} />} onClick={() => setShowSubjectForm(true)}>Edit</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleteSubjectConfirm(true)}>Delete</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Time', value: formatDuration(subject.totalMinutes ?? 0) },
          { label: 'Topics', value: String(subject.topicCount ?? 0) },
          { label: 'Completed', value: String(completed) },
          { label: 'In Progress', value: String(inProgress) },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-text-secondary">{s.label}</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['topics', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-text-primary'}`}>
            {t === 'topics' ? 'Topics' : 'Study History'}
          </button>
        ))}
      </div>

      {tab === 'topics' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto text-sm">
              <option value="">All statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="input w-auto text-sm">
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="flex-1" />
            <Button variant="primary" size="sm" icon={<Plus size={14} />}
              onClick={() => { setEditTopic(undefined); setShowTopicForm(true) }}>
              Add Topic
            </Button>
          </div>

          {topicsLoading ? (
            <div className="flex items-center justify-center py-10"><LoadingSpinner size="md" /></div>
          ) : topics.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} className="text-lavender-light" />}
              title="No topics yet"
              description={statusFilter || priorityFilter ? "No topics match the current filter" : "Add topics to organise your study plan"}
              action={!statusFilter && !priorityFilter ? (
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowTopicForm(true)}>Add Topic</Button>
              ) : undefined}
            />
          ) : (
            <div className="space-y-2">
              {topics.map(t => {
                const st = STATUS_MAP[t.status]
                return (
                  <div key={t.id}
                    className="bg-white rounded-xl border border-border p-3.5 flex items-center gap-3 hover:shadow-card-hover transition-shadow cursor-pointer"
                    onClick={() => setViewTopic(t)}>
                    <StatusIcon status={t.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{t.title}</p>
                      {t.description && <p className="text-xs text-text-secondary truncate mt-0.5">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.priority && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_MAP[t.priority].classes}`}>
                          {PRIORITY_MAP[t.priority].label}
                        </span>
                      )}
                      {t.deadline && (
                        <span className={`text-xs flex items-center gap-0.5 ${isOverdue(t.deadline) ? 'text-coral-strong' : isDueSoon(t.deadline) ? 'text-yellow-600' : 'text-text-secondary'}`}>
                          {isOverdue(t.deadline) && <AlertCircle size={10} />}
                          {formatDate(t.deadline)}
                        </span>
                      )}
                      <span className="text-xs font-medium text-primary min-w-[36px] text-right">
                        {formatDuration(t.totalMinutes ?? 0)}
                      </span>
                      <button onClick={e => { e.stopPropagation(); setEditTopic(t); setShowTopicForm(true) }}
                        className="p-1 rounded hover:bg-lavender-pale text-text-secondary hover:text-primary transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteTopicId(t.id) }}
                        className="p-1 rounded hover:bg-red-50 text-text-secondary hover:text-coral-strong transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <Card>
          {studyLogs.length === 0 ? (
            <EmptyState
              icon={<Clock size={28} className="text-lavender-light" />}
              title="No study history"
              description="Study logs for this subject will appear here"
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Topic', 'Duration', 'Notes'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-text-secondary pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studyLogs.map(l => (
                  <tr key={l.id} className="hover:bg-bg-main transition-colors">
                    <td className="py-2.5 pr-4 text-sm text-text-primary whitespace-nowrap">{formatDate(l.date)}</td>
                    <td className="py-2.5 pr-4 text-sm text-text-secondary">{l.topicTitle || '—'}</td>
                    <td className="py-2.5 pr-4"><span className="text-sm font-semibold text-primary">{formatDuration(l.durationMinutes)}</span></td>
                    <td className="py-2.5 text-sm text-text-secondary max-w-xs truncate">{l.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Modals */}
      <SubjectForm isOpen={showSubjectForm} onClose={() => setShowSubjectForm(false)} editSubject={subject} />
      <TopicForm isOpen={showTopicForm} onClose={() => { setShowTopicForm(false); setEditTopic(undefined) }} subjectId={id} editTopic={editTopic} />
      <TopicDetail
        topic={viewTopic} isOpen={!!viewTopic} onClose={() => setViewTopic(null)}
        onEdit={() => { if (viewTopic) { setEditTopic(viewTopic); setShowTopicForm(true) } }}
      />
      <ConfirmDialog
        isOpen={deleteSubjectConfirm}
        onClose={() => setDeleteSubjectConfirm(false)}
        onConfirm={() => deleteSubjectMutation.mutate(id)}
        title="Delete Subject"
        message={`Delete "${subject.name}"? This will also delete all its topics. Study logs will be kept.`}
        confirmLabel="Delete Subject" variant="danger"
      />
      <ConfirmDialog
        isOpen={deleteTopicId !== null}
        onClose={() => setDeleteTopicId(null)}
        onConfirm={() => { if (deleteTopicId !== null) deleteTopicMutation.mutate(deleteTopicId) }}
        title="Delete Topic"
        message="Delete this topic permanently? This cannot be undone."
        confirmLabel="Delete" variant="danger"
      />
    </div>
  )
}

// ─── Page Entry ───────────────────────────────────────────────────────────────

export default function SubjectsTopics() {
  const { id } = useParams<{ id: string }>()
  if (id) return <SubjectDetailView id={parseInt(id)} />
  return <SubjectListView />
}
