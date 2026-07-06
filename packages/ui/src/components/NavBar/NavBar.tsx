import { NavLink } from 'react-router-dom'
import styles from './NavBar.module.css'

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/chat', label: 'Chat' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/admin', label: 'Admin' }
]

// Single shared menu, rendered on every route (App shell). Active route highlighted via NavLink.
export const NavBar = (): JSX.Element => (
  <nav className={styles.topbar}>
    <NavLink to="/" className={styles.brand}>
      <span className={styles.logoMark}>A</span>
      <span className={styles.brandText}>ARK SYSTEMS</span>
    </NavLink>
    <div className={styles.links}>
      {LINKS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </div>
  </nav>
)
