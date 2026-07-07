import type { ReactNode } from 'react'
import styles from './AppBadge.module.css'

// Reusable badge/pill/chip primitive (App-prefixed, flat under components/). A plain themed <span> — not a
// MUI wrapper: these are tiny static labels, so MUI Chip would add weight without behavior. Consolidates
// the repeated base-class + value-modifier idiom; colors come from vars.css semantic tokens.

type BadgeTone =
  // decision / status / verdict color families (green / red / orange)
  | 'answer'
  | 'escalate'
  | 'route'
  // ticket priority
  | 'urgent'
  | 'high'
  | 'normal'
  | 'low'
  // customer tier
  | 'consumer'
  | 'smb'
  | 'enterprise'
  | 'vip'
  // knowledge confidence
  | 'confHigh'
  | 'confMed'
  | 'confLow'
  // generic (e.g. region)
  | 'neutral'

type BadgeSize = 'sm' | 'md' | 'lg'
type BadgeShape = 'pill' | 'rounded'

type Props = {
  tone: BadgeTone
  children: ReactNode
  size?: BadgeSize
  shape?: BadgeShape
  uppercase?: boolean
  className?: string
}

export const AppBadge = ({
  tone,
  children,
  size = 'md',
  shape = 'pill',
  uppercase = true,
  className
}: Props): JSX.Element => (
  <span
    className={[
      styles.badge,
      styles[tone],
      styles[size],
      styles[shape],
      uppercase ? styles.uppercase : '',
      className ?? ''
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </span>
)
