import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const COLLAPSED_KEY = 'daytrack_sidebar_collapsed'

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  function handleCollapse() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-main">
      <Sidebar collapsed={collapsed} onCollapse={handleCollapse} />
      <main className="flex-1 overflow-y-auto bg-bg-main p-6">
        <Outlet />
      </main>
    </div>
  )
}
