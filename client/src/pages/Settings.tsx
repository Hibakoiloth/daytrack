import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Save, Plus, Pencil, Trash2, Lock, Info } from 'lucide-react'
import { getSettings, updateSettings } from '@/services/settings'
import { getActivityCategories, createActivityCategory, updateActivityCategory, deleteActivityCategory } from '@/services/activityCategories'
import type { AppSettings, ActivityCategory } from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { today } from '@/utils/format'

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

export default function Settings() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [catAdding, setCatAdding] = useState(false)
  const [catEditId, setCatEditId] = useState<number | null>(null)
  const [catForm, setCatForm] = useState({ name: '', classification: 'neutral', color: '#929BB8' })
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  useEffect(() => {
    if (settings) setLocalSettings(settings)
  }, [settings])

  const { data: categories = [] } = useQuery({ queryKey: ['activity-categories'], queryFn: getActivityCategories })

  const updateMut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  })

  const createCatMut = useMutation({
    mutationFn: createActivityCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-categories'] }); setCatAdding(false); setCatForm({ name: '', classification: 'neutral', color: '#929BB8' }) }
  })
  const updateCatMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ActivityCategory> }) => updateActivityCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-categories'] }); setCatEditId(null) }
  })
  const deleteCatMut = useMutation({
    mutationFn: deleteActivityCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-categories'] }); setDeleteTarget(null) }
  })

  function handleSave() {
    updateMut.mutate(localSettings as AppSettings)
  }

  async function handleExport() {
    try {
      const response = await fetch('/api/export')
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daytrack-export-${today()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch {
      alert('Export failed. Make sure the server is running.')
    }
  }

  const deleteCatTarget = categories.find(c => c.id === deleteTarget)

  if (isLoading) return <div className="flex justify-center py-12"><span className="text-text-secondary">Loading settings...</span></div>

  const effectiveSettings = { ...(settings ?? {}), ...localSettings }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      {/* Preferences */}
      <Card title="Preferences">
        <div className="space-y-4">
          <Select
            label="Date Format"
            value={effectiveSettings.dateFormat || 'DD/MM/YYYY'}
            onChange={e => setLocalSettings(s => ({ ...s, dateFormat: e.target.value }))}
            options={[
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (13/11/2026)' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (11/13/2026)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-11-13)' },
            ]}
          />
          <Select
            label="Time Format"
            value={effectiveSettings.timeFormat || '12h'}
            onChange={e => setLocalSettings(s => ({ ...s, timeFormat: e.target.value }))}
            options={[
              { value: '12h', label: '12-hour (3:30 PM)' },
              { value: '24h', label: '24-hour (15:30)' },
            ]}
          />
          <Select
            label="Week Starts On"
            value={effectiveSettings.weekStartDay || 'monday'}
            onChange={e => setLocalSettings(s => ({ ...s, weekStartDay: e.target.value }))}
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' },
            ]}
          />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Default Daily Study Goal</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input w-28"
                min={0}
                max={1440}
                placeholder="120"
                value={effectiveSettings.defaultDailyStudyGoalMinutes || ''}
                onChange={e => setLocalSettings(s => ({ ...s, defaultDailyStudyGoalMinutes: parseInt(e.target.value) || 0 }))}
              />
              <span className="text-sm text-text-secondary">minutes per day</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button icon={<Save size={14} />} onClick={handleSave} disabled={updateMut.isPending}>Save Preferences</Button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          </div>
        </div>
      </Card>

      {/* Activity Categories */}
      <Card title="Activity Categories">
        <p className="text-sm text-text-secondary mb-4">Manage how activities are classified for productivity analytics.</p>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-main">
              {catEditId === cat.id ? (
                <div className="flex-1 flex gap-2 flex-wrap items-end">
                  <input className="input flex-1 min-w-0" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
                  <select className="input w-36" value={catForm.classification} onChange={e => setCatForm(f => ({ ...f, classification: e.target.value }))}>
                    <option value="productive">Productive</option>
                    <option value="neutral">Neutral</option>
                    <option value="distracting">Distracting</option>
                  </select>
                  <input type="color" className="w-9 h-9 rounded border border-border cursor-pointer p-0.5" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} />
                  <Button size="sm" onClick={() => updateCatMut.mutate({ id: cat.id, data: { name: catForm.name, classification: catForm.classification as ActivityCategory['classification'], color: catForm.color } })}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCatEditId(null)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full flex-shrink-0 border border-border" style={{ background: cat.color || CLASS_COLORS[cat.classification] }} />
                  <span className="flex-1 text-sm text-text-primary font-medium">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLASS_STYLES[cat.classification]}`}>{cat.classification}</span>
                  <button className="p-1 text-text-secondary hover:text-primary rounded" onClick={() => { setCatEditId(cat.id); setCatForm({ name: cat.name, classification: cat.classification, color: cat.color || '#929BB8' }) }}>
                    <Pencil size={14} />
                  </button>
                  {cat.isDefault ? (
                    <span className="p-1 text-text-secondary opacity-40" title="Default category (cannot be deleted)"><Lock size={14} /></span>
                  ) : (
                    <button className="p-1 text-text-secondary hover:text-coral-strong rounded" onClick={() => setDeleteTarget(cat.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {catAdding ? (
            <div className="flex gap-2 flex-wrap items-end pt-2">
              <input className="input flex-1 min-w-0" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
              <select className="input w-36" value={catForm.classification} onChange={e => setCatForm(f => ({ ...f, classification: e.target.value }))}>
                <option value="productive">Productive</option>
                <option value="neutral">Neutral</option>
                <option value="distracting">Distracting</option>
              </select>
              <input type="color" className="w-9 h-9 rounded border border-border cursor-pointer p-0.5" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} />
              <Button size="sm" onClick={() => createCatMut.mutate({ name: catForm.name, classification: catForm.classification as ActivityCategory['classification'], color: catForm.color, isDefault: false })}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setCatAdding(false)}>Cancel</Button>
            </div>
          ) : (
            <button className="flex items-center gap-2 text-sm text-primary font-medium mt-2 px-2 py-1.5 rounded hover:bg-bg-secondary transition-colors" onClick={() => setCatAdding(true)}>
              <Plus size={14} /> Add Category
            </button>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && deleteCatMut.mutate(deleteTarget)}
          title="Delete Category"
          message={`Delete "${deleteCatTarget?.name}"? Activity logs using this category will keep the log but lose the category.`}
        />
      </Card>

      {/* Data Export */}
      <Card title="Data Export">
        <p className="text-sm text-text-secondary mb-4">
          Download all your subjects, topics, study logs, activity logs, tasks, and calendar events as a JSON file.
        </p>
        <Button icon={<Download size={15} />} variant="secondary" onClick={handleExport}>
          Export All Data
        </Button>
        {exportDone && <p className="text-sm text-green-600 font-medium mt-2">✓ Export downloaded successfully</p>}
        <p className="text-xs text-text-secondary mt-3">
          This file can be used as a backup of your personal data. No data is sent to any server.
        </p>
      </Card>

      {/* About */}
      <Card title="About">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lavender-pale flex items-center justify-center">
              <Info size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">DayTrack</p>
              <p className="text-xs text-text-secondary">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary pt-1">Personal study and time tracking application. Understand your time. Build better habits.</p>
          <div className="bg-bg-main rounded-lg p-3 text-xs text-text-secondary font-mono mt-2">
            Database: ./data/daytrack.db (local SQLite)
          </div>
        </div>
      </Card>
    </div>
  )
}
