import type { ReactNode } from 'react'
import styles from './AppButton.module.css'

// Reusable button primitive (App-prefixed, flat under components/). A plain themed <button> — not a MUI
// wrapper: these buttons are heavily custom and native <button> already gives keyboard a11y (+ the global
// :focus-visible ring), so MUI Button would be mostly overridden for a ripple. `variant` covers the app's
// button looks; colors come from vars.css. `className` lets callers add layout-only tweaks (margins,
// min-width) without leaking button styling back into features.

type ButtonVariant = 'primary' | 'subtle' | 'cta' | 'answer' | 'escalate' | 'route'

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  ariaDescribedby?: string
}

export const AppButton = ({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className,
  ariaDescribedby
}: Props): JSX.Element => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    aria-describedby={ariaDescribedby}
    className={[styles.button, styles[variant], className ?? ''].filter(Boolean).join(' ')}
  >
    {children}
  </button>
)
