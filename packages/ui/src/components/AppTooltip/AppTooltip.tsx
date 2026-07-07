import { Tooltip } from '@mui/material'
import type { ReactElement, ReactNode } from 'react'
import styles from './AppTooltip.module.css'

// Reusable tooltip (App-prefixed). Wraps MUI Tooltip — here MUI earns its weight: positioning, a11y, and
// the disabled-target case. The child is wrapped in a <span> so the tooltip still fires when the target is
// a disabled control (browsers suppress events on disabled elements; the span catches hover/focus). An
// empty `title` renders no tooltip. Styled via CSS Modules over MUI's slot class (injectFirst).

type Props = {
  title: ReactNode
  children: ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const AppTooltip = ({ title, children, placement = 'top' }: Props): JSX.Element => (
  <Tooltip
    title={title}
    placement={placement}
    enterDelay={300}
    leaveDelay={0}
    slotProps={{ tooltip: { className: styles.tooltip } }}
  >
    <span className={styles.wrap}>{children}</span>
  </Tooltip>
)
