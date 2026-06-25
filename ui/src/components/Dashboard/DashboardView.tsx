import { SessionList } from './SessionList'

export const DashboardView = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f1117' }}>
      <SessionList />
    </div>
  )
}
