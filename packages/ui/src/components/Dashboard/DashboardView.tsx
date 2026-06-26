import { SessionList } from './SessionList'
import styles from './DashboardView.module.css'

export const DashboardView = (): JSX.Element => {
  return (
    <div className={styles.view}>
      <SessionList />
    </div>
  )
}
