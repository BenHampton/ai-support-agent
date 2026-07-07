import { SessionList } from './components/SessionList/SessionList'
import styles from './Dashboard.module.css'

export const Dashboard = (): JSX.Element => {
  return (
    <div className={styles.view}>
      <SessionList />
    </div>
  )
}
