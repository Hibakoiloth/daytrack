import React, { useState, useEffect } from 'react'

interface Subject {
  id: number
  name: string
  color: string
  createdAt: string
}

async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch('/api/subjects')
  const json = await res.json()
  return json.data ?? []
}

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetchSubjects().then(setSubjects)

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error('Failed to create subject')
      setName('')
      await load()
    } catch {
      setError('Failed to add subject. Is the server running?')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/subjects/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">DayTrack</h1>
        <p className="text-sm text-gray-500 mt-0.5">Study time tracker</p>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Add a subject..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {subjects.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No subjects yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {subjects.map(s => (
              <li key={s.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-medium text-gray-800">{s.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
