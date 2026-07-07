import { Alert } from '@mui/material'
import type { ReactNode } from 'react'
import styles from './AppAlert.module.css'

// Reusable alert (App-prefixed). Wraps MUI Alert — it brings the `role="alert"` semantics + severity icon.
// Styled to our dark theme via CSS Modules over MUI's slot classes (injectFirst). `className` lets callers
// add layout-only tweaks (e.g. margins).

type Severity = 'error' | 'info' | 'warning' | 'success'

type Props = {
  children: ReactNode
  severity?: Severity
  className?: string
}

export const AppAlert = ({ children, severity = 'info', className }: Props): JSX.Element => (
  <Alert
    severity={severity}
    variant="outlined"
    className={[styles.alert, styles[severity], className ?? ''].filter(Boolean).join(' ')}
  >
    {children}
  </Alert>
)
