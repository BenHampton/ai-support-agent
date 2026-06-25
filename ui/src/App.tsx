import { useState } from 'react'
import { ChatView } from './components/Chat/ChatView'
import { DashboardView } from './components/Dashboard/DashboardView'

type Tab = 'chat' | 'dashboard'

const styles: Record<string, React.CSSProperties> = {
  app: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f1117' },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '0 20px',
    height: 48,
    background: '#1a1d27',
    borderBottom: '1px solid #2d3148',
    flexShrink: 0
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 24,
    height: 24,
    background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    color: '#fff'
  },
  logoText: { fontSize: 14, fontWeight: 700, color: '#f1f5f9' },
  logoSub: { fontSize: 11, color: '#64748b' },
  tabs: { display: 'flex', gap: 2, marginLeft: 'auto' },
  tab: {
    background: 'none',
    border: 'none',
    borderRadius: 6,
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '5px 12px',
    transition: 'all 0.15s'
  },
  tabActive: {
    background: '#2d3148',
    color: '#e2e8f0'
  },
  content: { flex: 1, display: 'flex', overflow: 'hidden' }
}

export const App = () => {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>A</div>
          <div>
            <div style={styles.logoText}>Ark Systems Support AI</div>
            <div style={styles.logoSub}>Maven FDE Prototype</div>
          </div>
        </div>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'chat' ? styles.tabActive : {}) }}
            onClick={() => setTab('chat')}
          >
            Chat
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'dashboard' ? styles.tabActive : {}) }}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
        </div>
      </div>
      <div style={styles.content}>
        {tab === 'chat' ? <ChatView /> : <DashboardView />}
      </div>
    </div>
  )
}
