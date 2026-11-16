import db from '../../database/db'

export interface DashboardSummary {
  studyToday: number
  studyWeek: number
  studyMonth: number
  subjectCount: number
  topicCount: number
  completedTopics: number
  inProgressTopics: number
  pendingTasks: number
}

export interface StudyByDay {
  date: string
  minutes: number
}

export interface SubjectTotal {
  subjectId: number
  subjectName: string
  totalMinutes: number
  sessionCount: number
}

export interface TopicTotal {
  topicId: number
  topicTitle: string
  subjectId: number
  subjectName: string
  totalMinutes: number
  sessionCount: number
}

export interface ActivityStats {
  totalMinutes: number
  productiveMinutes: number
  neutralMinutes: number
  distractingMinutes: number
  productivityPercent: number
}

export interface CategoryBreakdown {
  categoryId: number
  categoryName: string
  classification: string
  color?: string
  totalMinutes: number
  sessionCount: number
}

export const analyticsRepo = {
  getDashboardSummary(): DashboardSummary {
    const studyToday = (db.prepare(
      "SELECT COALESCE(SUM(duration_minutes),0) as val FROM study_logs WHERE date=date('now','localtime')"
    ).get() as { val: number }).val

    const studyWeek = (db.prepare(
      "SELECT COALESCE(SUM(duration_minutes),0) as val FROM study_logs WHERE date >= date('now','localtime','-6 days')"
    ).get() as { val: number }).val

    const studyMonth = (db.prepare(
      "SELECT COALESCE(SUM(duration_minutes),0) as val FROM study_logs WHERE strftime('%Y-%m',date)=strftime('%Y-%m',date('now','localtime'))"
    ).get() as { val: number }).val

    const subjectCount = (db.prepare('SELECT COUNT(*) as val FROM subjects').get() as { val: number }).val
    const topicCount = (db.prepare('SELECT COUNT(*) as val FROM topics').get() as { val: number }).val
    const completedTopics = (db.prepare("SELECT COUNT(*) as val FROM topics WHERE status='completed'").get() as { val: number }).val
    const inProgressTopics = (db.prepare("SELECT COUNT(*) as val FROM topics WHERE status='in_progress'").get() as { val: number }).val
    const pendingTasks = (db.prepare("SELECT COUNT(*) as val FROM tasks WHERE status != 'completed'").get() as { val: number }).val

    return {
      studyToday,
      studyWeek,
      studyMonth,
      subjectCount,
      topicCount,
      completedTopics,
      inProgressTopics,
      pendingTasks,
    }
  },

  getStudyByDay(startDate: string, endDate: string): StudyByDay[] {
    return db.prepare(`
      SELECT date, SUM(duration_minutes) as minutes
      FROM study_logs
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date
    `).all(startDate, endDate) as StudyByDay[]
  },

  getSubjectTotals(startDate?: string, endDate?: string): SubjectTotal[] {
    const conditions: string[] = []
    const params: string[] = []

    if (startDate) { conditions.push('sl.date >= ?'); params.push(startDate) }
    if (endDate) { conditions.push('sl.date <= ?'); params.push(endDate) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    return db.prepare(`
      SELECT
        s.id as subjectId,
        s.name as subjectName,
        s.color as subjectColor,
        COALESCE(SUM(sl.duration_minutes), 0) as totalMinutes,
        COUNT(sl.id) as sessionCount
      FROM subjects s
      LEFT JOIN study_logs sl ON sl.subject_id = s.id ${where ? 'AND ' + conditions.join(' AND ') : ''}
      GROUP BY s.id, s.name
      ORDER BY totalMinutes DESC
    `).all(...params) as SubjectTotal[]
  },

  getTopicTotals(startDate?: string, endDate?: string): TopicTotal[] {
    const conditions: string[] = []
    const params: string[] = []

    if (startDate) { conditions.push('sl.date >= ?'); params.push(startDate) }
    if (endDate) { conditions.push('sl.date <= ?'); params.push(endDate) }

    const slWhere = conditions.length ? `AND ${conditions.join(' AND ')}` : ''

    return db.prepare(`
      SELECT
        t.id as topicId,
        t.title as topicTitle,
        s.id as subjectId,
        s.name as subjectName,
        COALESCE(SUM(sl.duration_minutes), 0) as totalMinutes,
        COUNT(sl.id) as sessionCount
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN study_logs sl ON sl.topic_id = t.id ${slWhere}
      GROUP BY t.id, t.title, s.id, s.name
      ORDER BY totalMinutes DESC
    `).all(...params) as TopicTotal[]
  },

  getActivityStats(startDate?: string, endDate?: string): ActivityStats {
    const conditions: string[] = []
    const params: string[] = []

    if (startDate) { conditions.push('al.date >= ?'); params.push(startDate) }
    if (endDate) { conditions.push('al.date <= ?'); params.push(endDate) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const rows = db.prepare(`
      SELECT
        COALESCE(ac.classification, 'neutral') as classification,
        SUM(al.duration_minutes) as minutes
      FROM activity_logs al
      LEFT JOIN activity_categories ac ON ac.id = al.category_id
      ${where}
      GROUP BY COALESCE(ac.classification, 'neutral')
    `).all(...params) as { classification: string; minutes: number }[]

    let totalMinutes = 0
    let productiveMinutes = 0
    let neutralMinutes = 0
    let distractingMinutes = 0

    for (const row of rows) {
      totalMinutes += row.minutes
      if (row.classification === 'productive') productiveMinutes += row.minutes
      else if (row.classification === 'distracting') distractingMinutes += row.minutes
      else neutralMinutes += row.minutes
    }

    const productivityPercent = totalMinutes > 0
      ? Math.round((productiveMinutes / totalMinutes) * 100)
      : 0

    return { totalMinutes, productiveMinutes, neutralMinutes, distractingMinutes, productivityPercent }
  },

  getCategoryBreakdown(startDate?: string, endDate?: string): CategoryBreakdown[] {
    const conditions: string[] = []
    const params: string[] = []

    if (startDate) { conditions.push('al.date >= ?'); params.push(startDate) }
    if (endDate) { conditions.push('al.date <= ?'); params.push(endDate) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    return db.prepare(`
      SELECT
        ac.id as categoryId,
        ac.name as categoryName,
        ac.classification,
        ac.color,
        COALESCE(SUM(al.duration_minutes), 0) as totalMinutes,
        COUNT(al.id) as sessionCount
      FROM activity_categories ac
      LEFT JOIN activity_logs al ON al.category_id = ac.id ${where ? 'AND ' + conditions.join(' AND ') : ''}
      GROUP BY ac.id, ac.name, ac.classification, ac.color
      ORDER BY totalMinutes DESC
    `).all(...params) as CategoryBreakdown[]
  },
}
