import { useState } from 'react'
import { ChatView } from './components/Chat/ChatView'
import { DashboardView } from './components/Dashboard/DashboardView'
import { TicketsView } from './components/Tickets/TicketsView'
import styles from './App.module.css'

type Tab = 'chat' | 'dashboard' | 'tickets'

export const App = (): JSX.Element => {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>A</div>
          <div>
            <div className={styles.logoText}>Ark Systems Support AI</div>
            <div className={styles.logoSub}>Maven FDE Prototype</div>
          </div>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'chat' ? styles.tabActive : ''}`}
            onClick={() => setTab('chat')}
          >
            Chat
          </button>
          <button
            className={`${styles.tab} ${tab === 'dashboard' ? styles.tabActive : ''}`}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`${styles.tab} ${tab === 'tickets' ? styles.tabActive : ''}`}
            onClick={() => setTab('tickets')}
          >
            Tickets
          </button>
        </div>
      </div>
      <div className={styles.content}>
        {tab === 'chat' && <ChatView />}
        {tab === 'dashboard' && <DashboardView />}
        {tab === 'tickets' && <TicketsView />}
      </div>
    </div>
  )
}
