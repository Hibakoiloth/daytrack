import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckSquare, Bell, Plus, Pencil, Trash2, Check, X,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react'
import type { Task, Reminder, Subject, Topic } from '@/types'
import { getTasks, createTask, updateTask, deleteTask } from '@/services/tasks'
import { getReminders, createReminder, updateReminder, deleteReminder } from '@/services/reminders'
import { getSubjects } from '@/services/subjects'
import { getTopics } from '@/services/topics'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate, today, isOverdue, isDueSoon } from '@/utils/format'

// ─── Priority colors ──────────────────────────────────────────────────────────

const priorityBorder: Record<string, string> = {
  low: '#C4C9E5',
  medium: '#6976CC',
  high: '#E4484B',
}

const priorityLabel: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'completed'
    ? 'bg-green-50 text-green-700'
    : status === 'in_progress'
    ? 'bg-lavender-pale text-primary'
    : 'bg-bg-secondary text-text-secondary'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{statusLabel[status] ?? status}</span>
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === 'high'
    ? 'bg-red-50 text-coral-strong'
    : priority === 'medium'
    ? 'bg-lavender-pale text-primary'
    : 'bg-bg-secondary text-text-secondary'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{priorityLabel[priority] ?? priority}</span>
}

// ─── Task Form ────────────────────────────────────────────────────────────────

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  initial?: Task
  subjects: Subject[]
}

function TaskForm({ isOpen, onClose, initial, subjects }: TaskFormProps) {
  const qc = useQueryClient()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'pending')
  const [priority, setPriority] = useState(initial?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [subjectId, setSubjectId] = useState<string>(initial?.subjectId?.toString() ?? '')
  const [topicId, setTopicId] = useState<string>(initial?.topicId?.toString() ?? '')
  const [error, setError] = useState('')

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getTopics({ subjectId: parseInt(subjectId) }),
    enabled: !!subjectId,
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<Task>) =>
      initial ? updateTask(initial.id, data) : createTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title ?? '')
      setDescription(initial?.description ?? '')
      setStatus(initial?.status ?? 'pending')
      setPriority(initial?.priority ?? 'medium')
      setDueDate(initial?.dueDate ?? '')
      setSubjectId(initial?.subjectId?.toString() ?? '')
      setTopicId(initial?.topicId?.toString() ?? '')
      setError('')
    }
  }, [isOpen, initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      status: status as Task['status'],
      priority: priority as Task['priority'],
      dueDate: dueDate || undefined,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      topicId: topicId ? parseInt(topicId) : undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Task' : 'Add Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-coral-strong bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Optional details..." />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
        <Input label="Due Date (Optional)" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <Select
          label="Subject (Optional)"
          value={subjectId}
          onChange={e => { setSubjectId(e.target.value); setTopicId('') }}
          options={subjects.map(s => ({ value: s.id.toString(), label: s.name }))}
          placeholder="Select subject..."
        />
        {subjectId && (
          <Select
            label="Topic (Optional)"
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            options={topics.map(t => ({ value: t.id.toString(), label: t.title }))}
            placeholder="Select topic..."
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : initial ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Reminder Form ────────────────────────────────────────────────────────────

interface ReminderFormProps {
  isOpen: boolean
  onClose: () => void
  initial?: Reminder
  tasks: Task[]
}

function ReminderForm({ isOpen, onClose, initial, tasks }: ReminderFormProps) {
  const qc = useQueryClient()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial?.reminderDate ?? today())
  const [time, setTime] = useState(initial?.reminderTime ?? '09:00')
  const [taskId, setTaskId] = useState<string>(initial?.taskId?.toString() ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: Partial<Reminder>) =>
      initial ? updateReminder(initial.id, data) : createReminder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title ?? '')
      setDescription(initial?.description ?? '')
      setDate(initial?.reminderDate ?? today())
      setTime(initial?.reminderTime ?? '09:00')
      setTaskId(initial?.taskId?.toString() ?? '')
      setError('')
    }
  }, [isOpen, initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (!date) { setError('Date is required'); return }
    if (!time) { setError('Time is required'); return }
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      reminderDate: date,
      reminderTime: time,
      taskId: taskId ? parseInt(taskId) : undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Reminder' : 'Add Reminder'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-coral-strong bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" autoFocus />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional notes..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date *" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Time *" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <Select
          label="Associated Task (Optional)"
          value={taskId}
          onChange={e => setTaskId(e.target.value)}
          options={tasks.filter(t => t.status !== 'completed').map(t => ({ value: t.id.toString(), label: t.title }))}
          placeholder="Select task..."
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : initial ? 'Save' : 'Add Reminder'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ subjects }: { subjects: Subject[] }) {
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, current }: { id: number; current: string }) =>
      updateTask(id, { status: current === 'completed' ? 'pending' : 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, filterStatus, filterPriority, search])

  const active = filtered.filter(t => t.status !== 'completed')
  const completed = filtered.filter(t => t.status === 'completed')

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-36"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="input w-36"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="input flex-1 min-w-40"
        />
      </div>

      {/* Task list */}
      {active.length === 0 && completed.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={40} className="text-lavender-light" />}
          title="No tasks yet"
          description="Add tasks to track what you need to do"
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>Add Task</Button>}
        />
      ) : (
        <div className="space-y-2">
          {active.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleMutation.mutate({ id: task.id, current: task.status })}
              onEdit={() => { setEditTask(task); setShowForm(true) }}
              onDelete={() => setDeleteId(task.id)}
            />
          ))}
          {completed.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Completed ({completed.length})</p>
              <div className="space-y-2 opacity-60">
                {completed.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleMutation.mutate({ id: task.id, current: task.status })}
                    onEdit={() => { setEditTask(task); setShowForm(true) }}
                    onDelete={() => setDeleteId(task.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <TaskForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTask(undefined) }}
        initial={editTask}
        subjects={subjects}
      />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteMutation.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
      />
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete }: {
  task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void
}) {
  const completed = task.status === 'completed'
  const overdue = task.dueDate && isOverdue(task.dueDate) && !completed
  const soon = task.dueDate && !overdue && isDueSoon(task.dueDate)

  return (
    <div
      className="bg-white rounded-xl border border-border shadow-card px-4 py-3 flex gap-3"
      style={{ borderLeft: `3px solid ${priorityBorder[task.priority] ?? '#C4C9E5'}` }}
    >
      <button
        onClick={onToggle}
        className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'
        }`}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed && <Check size={10} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.subjectName && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-lavender-pale text-primary font-medium">{task.subjectName}</span>
          )}
          {task.dueDate && (
            <span className={`text-xs font-medium ${overdue ? 'text-coral-strong' : soon ? 'text-orange-500' : 'text-text-secondary'}`}>
              {overdue ? '⚠ Overdue: ' : 'Due: '}{formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-primary transition-colors" aria-label="Edit">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-coral-strong transition-colors" aria-label="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Reminders Tab ────────────────────────────────────────────────────────────

function RemindersTab({ tasks }: { tasks: Task[] }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editReminder, setEditReminder] = useState<Reminder | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDone, setShowDone] = useState(false)

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => getReminders({ showDismissed: true }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Reminder> }) => updateReminder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const now = new Date()
  const nowStr = now.toTimeString().slice(0, 5)
  const todayStr = today()

  const active = reminders.filter(r => !r.isDismissed && !r.isCompleted)
  const overdue = active.filter(r =>
    r.reminderDate < todayStr || (r.reminderDate === todayStr && r.reminderTime <= nowStr)
  )
  const upcoming = active.filter(r =>
    r.reminderDate > todayStr || (r.reminderDate === todayStr && r.reminderTime > nowStr)
  )
  const done = reminders.filter(r => r.isDismissed || r.isCompleted)

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-coral-strong uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertCircle size={13} /> Overdue ({overdue.length})
          </p>
          <div className="space-y-2">
            {overdue.map(r => (
              <ReminderItem key={r.id} reminder={r} isOverdue
                onComplete={() => updateMutation.mutate({ id: r.id, data: { isCompleted: true } })}
                onDismiss={() => updateMutation.mutate({ id: r.id, data: { isDismissed: true } })}
                onEdit={() => { setEditReminder(r); setShowForm(true) }}
                onDelete={() => setDeleteId(r.id)}
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1">
            <Clock size={13} /> Upcoming ({upcoming.length})
          </p>
          <div className="space-y-2">
            {upcoming.map(r => (
              <ReminderItem key={r.id} reminder={r} isOverdue={false}
                onComplete={() => updateMutation.mutate({ id: r.id, data: { isCompleted: true } })}
                onDismiss={() => updateMutation.mutate({ id: r.id, data: { isDismissed: true } })}
                onEdit={() => { setEditReminder(r); setShowForm(true) }}
                onDelete={() => setDeleteId(r.id)}
              />
            ))}
          </div>
        </div>
      ) : overdue.length === 0 && (
        <EmptyState
          icon={<Bell size={40} className="text-lavender-light" />}
          title="No reminders"
          description="Add a reminder to get notified at a specific time"
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>Add Reminder</Button>}
        />
      )}

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(v => !v)}
            className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 mb-2"
          >
            {showDone ? '▾' : '▸'} Completed / Dismissed ({done.length})
          </button>
          {showDone && (
            <div className="space-y-2 opacity-50">
              {done.map(r => (
                <ReminderItem key={r.id} reminder={r} isOverdue={false}
                  onComplete={() => {}}
                  onDismiss={() => {}}
                  onEdit={() => {}}
                  onDelete={() => setDeleteId(r.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ReminderForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditReminder(undefined) }}
        initial={editReminder}
        tasks={tasks}
      />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteMutation.mutate(deleteId!); setDeleteId(null) }}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder?"
      />
    </div>
  )
}

function ReminderItem({ reminder, isOverdue, onComplete, onDismiss, onEdit, onDelete }: {
  reminder: Reminder; isOverdue: boolean
  onComplete: () => void; onDismiss: () => void
  onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-card px-4 py-3 flex gap-3 ${isOverdue ? 'border-coral' : 'border-border'}`}>
      <Bell size={16} className={`flex-shrink-0 mt-0.5 ${isOverdue ? 'text-coral-strong' : 'text-primary'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{reminder.title}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {formatDate(reminder.reminderDate)} at {reminder.reminderTime}
        </p>
        {reminder.description && (
          <p className="text-xs text-text-secondary mt-0.5">{reminder.description}</p>
        )}
        {reminder.taskTitle && (
          <p className="text-xs text-primary mt-1">↗ {reminder.taskTitle}</p>
        )}
      </div>
      {!reminder.isDismissed && !reminder.isCompleted && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onComplete} title="Mark complete"
            className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-green-600 transition-colors">
            <Check size={13} />
          </button>
          <button onClick={onDismiss} title="Dismiss"
            className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
            <X size={13} />
          </button>
          <button onClick={onEdit} title="Edit"
            className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-primary transition-colors">
            <Pencil size={13} />
          </button>
        </div>
      )}
      <button onClick={onDelete} title="Delete"
        className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-coral-strong transition-colors flex-shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'tasks' | 'reminders'

export default function TasksReminders() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => getTasks() })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Tasks &amp; Reminders</h1>
        <Button
          onClick={() => tab === 'tasks' ? setShowTaskForm(true) : setShowReminderForm(true)}
          icon={<Plus size={15} />}
        >
          {tab === 'tasks' ? 'Add Task' : 'Add Reminder'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary p-1 rounded-lg w-fit mb-5">
        {(['tasks', 'reminders'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-text-primary shadow-card' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'tasks' ? <><CheckSquare size={14} /> Tasks</> : <><Bell size={14} /> Reminders</>}
          </button>
        ))}
      </div>

      {tab === 'tasks' ? (
        <TasksTab subjects={subjects} />
      ) : (
        <RemindersTab tasks={tasks} />
      )}

      {/* Hidden forms triggered from header button */}
      {showTaskForm && (
        <TaskForm isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} subjects={subjects} />
      )}
      {showReminderForm && (
        <ReminderForm isOpen={showReminderForm} onClose={() => setShowReminderForm(false)} tasks={tasks} />
      )}
    </div>
  )
}
