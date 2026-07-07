import { FormControl, MenuItem, Select, type SelectChangeEvent } from '@mui/material'
import styles from './AppSelectOptions.module.css'

// Reusable app-wide select (App-prefixed, lives directly under components/). First wrapped MUI primitive —
// the rest of the app imports this, never MUI directly. Styled with a co-located CSS Module (via MUI's
// global slot classes) using vars.css tokens, consistent with every other component.

type Option = { value: string; label?: string }

// `value` = big stat-value look (hover-reveal); `control` = a normal bordered form select
type SelectSize = 'value' | 'control'

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  size?: SelectSize
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel: string
}

export const AppSelectOptions = ({
  value,
  onChange,
  options,
  size = 'value',
  disabled = false,
  fullWidth = false,
  ariaLabel
}: Props): JSX.Element => {
  const handleChange = (e: SelectChangeEvent): void => onChange(e.target.value)
  const triggerClass = `${styles.select} ${size === 'control' ? styles.control : styles.value}`
  const paperClass = `${styles.menu} ${size === 'control' ? styles.menuControl : styles.menuValue}`

  return (
    <FormControl variant="standard" disabled={disabled} fullWidth={fullWidth}>
      <Select
        value={value}
        onChange={handleChange}
        className={triggerClass}
        inputProps={{ 'aria-label': ariaLabel }}
        MenuProps={{ slotProps: { paper: { className: paperClass } } }}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label ?? o.value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
