import type { ReactNode } from 'react'
import styles from './AppButton.module.css'

// Reusable button primitive (App-prefixed). A plain themed <button> — native a11y + the global
// :focus-visible ring, so MUI Button would be mostly overridden for a ripple. One consistent look (outline
// pill that fills on hover, modeled on the hero "ENTER CONSOLE" button); `variant` only changes the color,
// `size` scales it. `className` is for layout-only tweaks (margins, min-width).

type ButtonVariant = 'primary' | 'subtle' | 'escalate' | 'answer' | 'route'
type ButtonSize = 'md' | 'lg'

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  ariaDescribedby?: string
}

export const AppButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
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
    className={[styles.button, styles[variant], styles[size], className ?? ''].filter(Boolean).join(' ')}
  >
    {children}
  </button>
)
