import { Routes, Route, Navigate } from 'react-router-dom'
import { NavBar } from './components/NavBar/NavBar'
import { ChatView } from './components/Chat/ChatView'
import { DashboardView } from './components/Dashboard/DashboardView'
import { TicketsView } from './components/Tickets/TicketsView'
import { LandingView } from './components/Landing/LandingView'
import styles from './App.module.css'

export const App = (): JSX.Element => (
  <div className={styles.app}>
    <NavBar />
    <main className={styles.content}>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/tickets" element={<TicketsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </div>
)
