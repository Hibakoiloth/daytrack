import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/services/calendar'
import { getSubjects } from '@/services/subjects'
import { getTopics } from '@/services/topics'
import type { CalendarEvent, Subject, Topic } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { today, formatDate } from '@/utils/format'

const CATEGORY_COLORS: Record<string, string> = {
  study: '#6976CC',
  work: '#626FC5',
  personal: '#F5A623',
  assignment: '#E98F91',
  deadline: '#E4484B',
  reminder: '#C4C9E5',
  general: '#929BB8',
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'study', label: 'Study' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'reminder', label: 'Reminder' },
]

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getMonthGrid(year: number, month: number): Array<{ date: string; isCurrentMonth: boolean; isToday: boolean }> {
  const todayStr = today()
  const firstDay = new Date(year, month - 1, 1)
  // Convert Sunday=0 to Mon=0..Sun=6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = getDaysInMonth(year, month)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrev = getDaysInMonth(prevYear, prevMonth)

  const cells: Array<{ date: string; isCurrentMonth: boolean; isToday: boolean }> = []

  // Previous month days
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const m = String(prevMonth).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const date = `${prevYear}-${m}-${dd}`
    cells.push({ date, isCurrentMonth: false, isToday: false })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const date = `${year}-${m}-${dd}`
    cells.push({ date, isCurrentMonth: true, isToday: date === todayStr })
  }

  // Next month to fill the grid
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  let d = 1
  while (cells.length % 7 !== 0) {
    const m = String(nextMonth).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const date = `${nextYear}-${m}-${dd}`
    cells.push({ date, isCurrentMonth: false, isToday: false })
    d++
  }

  return cells
}

function getWeekDates(from: Date): string[] {
  const dow = from.getDay()
  const diff = (dow === 0 ? -6 : 1 - dow) // adjust to Monday
  const monday = new Date(from)
  monday.setDate(from.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

// ─── Event Form ─────────────────────────────────────────────────────────────
interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  editing?: CalendarEvent | null
  defaultDate?: string
  subjects: Subject[]
}

function EventForm({ isOpen, onClose, editing, defaultDate, subjects }: EventFormProps) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState(defaultDate || today())
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [category, setCategory] = useState('general')
  const [subjectId, setSubjectId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [error, setError] = useState('')

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getTopics({ subjectId: subjectId ? Number(subjectId) : undefined }),
    enabled: !!subjectId
  })

  React.useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setDescription(editing.description || '')
      setEventDate(editing.eventDate)
      setAllDay(editing.allDay)
      setStartTime(editing.startTime || '')
      setEndTime(editing.endTime || '')
      setCategory(editing.category)
      setSubjectId(editing.subjectId ? String(editing.subjectId) : '')
      setTopicId(editing.topicId ? String(editing.topicId) : '')
    } else {
      setTitle(''); setDescription(''); setEventDate(defaultDate || today()); setAllDay(true)
      setStartTime(''); setEndTime(''); setCategory('general'); setSubjectId(''); setTopicId('')
    }
    setError('')
  }, [editing, isOpen, defaultDate])

  React.useEffect(() => { setTopicId('') }, [subjectId])

  const saveMut = useMutation({
    mutationFn: (data: Partial<CalendarEvent>) =>
      editing ? updateCalendarEvent(editing.id, data) : createCalendarEvent(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar-events'] }); onClose() }
  })

  function handleSave() {
    if (!title.trim()) return setError('Title is required')
    setError('')
    saveMut.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      eventDate,
      allDay,
      startTime: allDay ? undefined : startTime || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      category,
      subjectId: subjectId ? Number(subjectId) : undefined,
      topicId: topicId ? Number(topicId) : undefined,
    })
  }

  const subjectOptions = [{ value: '', label: 'No subject' }, ...subjects.map(s => ({ value: String(s.id), label: s.name }))]
  const topicOptions = [{ value: '', label: 'No topic' }, ...topics.map(t => ({ value: String(t.id), label: t.title }))]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Event' : 'Add Event'}>
      <div className="space-y-4">
        {error && <p className="text-sm text-coral-strong bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description" />
        <Input label="Date *" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-text-primary">All day event</span>
          </label>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}
        <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
        <Select label="Subject (optional)" value={subjectId} onChange={e => setSubjectId(e.target.value)} options={subjectOptions} />
        {subjectId && <Select label="Topic (optional)" value={topicId} onChange={e => setTopicId(e.target.value)} options={topicOptions} />}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMut.isPending}>{editing ? 'Save Changes' : 'Add Event'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Event Detail Modal ─────────────────────────────────────────────────────
interface EventDetailProps {
  event: CalendarEvent | null
  onClose: () => void
  onEdit: (e: CalendarEvent) => void
  onDelete: (e: CalendarEvent) => void
}

function EventDetail({ event, onClose, onEdit, onDelete }: EventDetailProps) {
  if (!event) return null
  const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.general
  return (
    <Modal isOpen={!!event} onClose={onClose} title={event.title} size="sm">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs font-medium capitalize" style={{ color }}>{event.category}</span>
        </div>
        {event.description && <p className="text-sm text-text-secondary">{event.description}</p>}
        <div className="text-sm text-text-primary">
          <span className="font-medium">{formatDate(event.eventDate)}</span>
          {!event.allDay && event.startTime && (
            <span className="text-text-secondary ml-2">{event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</span>
          )}
        </div>
        {event.subjectName && <p className="text-sm text-text-secondary">Subject: <span className="text-text-primary">{event.subjectName}</span></p>}
        {event.topicTitle && <p className="text-sm text-text-secondary">Topic: <span className="text-text-primary">{event.topicTitle}</span></p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => { onClose(); onEdit(event) }}>Edit</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDelete(event)}>Delete</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function Calendar() {
  const qc = useQueryClient()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState(today())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  const monthGrid = useMemo(() => getMonthGrid(year, month), [year, month])

  const queryParams = view === 'month'
    ? { year, month }
    : { startDate: weekDates[0], endDate: weekDates[6] }

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', view, year, month, weekDates[0]],
    queryFn: () => getCalendarEvents(queryParams)
  })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCalendarEvent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar-events'] }); setDeleteTarget(null); setDetailEvent(null) }
  })

  function navigate(dir: number) {
    if (view === 'month') {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1))
    } else {
      setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + dir * 7); return nd })
    }
  }

  function goToday() { setCurrentDate(new Date()) }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

  function headerLabel() {
    if (view === 'month') return `${MONTH_NAMES[month - 1]} ${year}`
    return `${formatDate(weekDates[0])} – ${formatDate(weekDates[6])}`
  }

  function eventsForDate(dateStr: string) {
    return events.filter(e => e.eventDate === dateStr)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Calendar</h1>
        <Button icon={<Plus size={15} />} onClick={() => { setEditEvent(null); setDefaultDate(today()); setShowForm(true) }}>Add Event</Button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-border shadow-card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-bg-main rounded-lg p-1">
          {(['month', 'week'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === v ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
              {v === 'month' ? 'Month' : 'Week'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-text-primary min-w-48 text-center">{headerLabel()}</span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"><ChevronRight size={18} /></button>
        </div>
        <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {view === 'month' ? (
          <>
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEK_DAYS.map(d => (
                <div key={d} className="text-center py-2.5 text-xs font-medium text-text-secondary">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {monthGrid.map((cell, idx) => {
                const dayEvents = eventsForDate(cell.date)
                const shown = dayEvents.slice(0, 3)
                const overflow = dayEvents.length - 3
                return (
                  <div
                    key={idx}
                    onClick={() => { setDefaultDate(cell.date); setEditEvent(null); setShowForm(true) }}
                    className={`min-h-[90px] p-2 border-b border-r border-border cursor-pointer hover:bg-bg-main transition-colors ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${cell.isToday ? 'bg-primary text-white' : 'text-text-primary'}`}>
                      {cell.date.split('-')[2].replace(/^0/, '')}
                    </div>
                    <div className="space-y-0.5">
                      {shown.map(ev => (
                        <div
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); setDetailEvent(ev) }}
                          className="text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-90"
                          style={{ background: CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.general }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {overflow > 0 && <div className="text-xs text-text-secondary pl-1">+{overflow} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          // Week view
          <div className="grid grid-cols-7">
            {weekDates.map((dateStr, idx) => {
              const dayEvents = eventsForDate(dateStr)
              const isToday = dateStr === today()
              const [, , d] = dateStr.split('-').map(Number)
              return (
                <div key={idx} className="border-r border-border last:border-r-0">
                  <div className={`py-3 text-center border-b border-border ${isToday ? 'bg-lavender-pale' : ''}`}>
                    <p className="text-xs text-text-secondary">{WEEK_DAYS[idx]}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-primary' : 'text-text-primary'}`}>{d}</p>
                  </div>
                  <div className="p-2 space-y-1 min-h-[120px]">
                    <button
                      onClick={() => { setDefaultDate(dateStr); setEditEvent(null); setShowForm(true) }}
                      className="w-full text-xs text-text-secondary hover:text-primary py-1 rounded hover:bg-bg-secondary transition-colors"
                    >+ Add</button>
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setDetailEvent(ev)}
                        className="text-xs px-2 py-1 rounded text-white cursor-pointer hover:opacity-90 truncate"
                        style={{ background: CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.general }}
                      >
                        {ev.startTime && <span className="opacity-75 mr-1">{ev.startTime}</span>}{ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <EventForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditEvent(null) }}
        editing={editEvent}
        defaultDate={defaultDate}
        subjects={subjects}
      />
      <EventDetail
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={e => { setEditEvent(e); setShowForm(true) }}
        onDelete={e => { setDetailEvent(null); setDeleteTarget(e) }}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </div>
  )
}
