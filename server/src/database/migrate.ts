import fs from 'fs'
import path from 'path'
import db from './db'

export function runMigrations(): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)
  const dir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    const row = db.prepare('SELECT id FROM _migrations WHERE name = ?').get(file)
    if (!row) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8')
      db.exec(sql)
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
      console.log('[migrate] Applied:', file)
    }
  }
}
