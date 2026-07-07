import { FormControl, MenuItem, Select, type SelectChangeEvent } from '@mui/material'
import styles from './AppSelectOptions.module.css'

// Reusable app-wide select (App-prefixed, lives directly under components/). First wrapped MUI primitive —
// the rest of the app imports this, never MUI directly. Styled with a co-located CSS Module (via MUI's
// global slot classes) using vars.css tokens, consistent with every other component.

type Option = { value: string; label?: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel: string
}

export const AppSelectOptions = ({
  value,
  onChange,
  options,
  disabled = false,
  fullWidth = false,
  ariaLabel
}: Props): JSX.Element => {
  const handleChange = (e: SelectChangeEvent): void => onChange(e.target.value)

  return (
    <FormControl variant="standard" disabled={disabled} fullWidth={fullWidth}>
      <Select
        value={value}
        onChange={handleChange}
        className={styles.select}
        inputProps={{ 'aria-label': ariaLabel }}
        MenuProps={{ slotProps: { paper: { className: styles.menu } } }}
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
