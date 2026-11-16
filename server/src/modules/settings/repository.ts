import db from '../../database/db'

export const settingsRepo = {
  getAll(): Record<string, string> {
    const rows = db.prepare('SELECT key, value FROM app_settings').all() as { key: string; value: string }[]
    return rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.key] = row.value
      return acc
    }, {})
  },

  get(key: string): string | undefined {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value
  },

  set(key: string, value: string): void {
    db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `).run(key, value)
  },

  setMany(settings: Record<string, string>): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `)
    const transaction = db.transaction((entries: [string, string][]) => {
      for (const [key, value] of entries) {
        stmt.run(key, value)
      }
    })
    transaction(Object.entries(settings))
  },
}
