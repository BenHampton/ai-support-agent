import { Routes, Route, Navigate } from 'react-router-dom'
import { NavBar } from '@components/NavBar/NavBar'
import { Chat } from '@pages/Chat/Chat'
import { Dashboard } from '@pages/Dashboard/Dashboard'
import { Tickets } from '@pages/Tickets/Tickets'
import { Admin } from '@pages/Admin/Admin'
import { Landing } from '@pages/Landing/Landing'
import styles from './App.module.css'

export const App = (): JSX.Element => (
  <div className={styles.app}>
    <NavBar />
    <main className={styles.content}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </div>
)
