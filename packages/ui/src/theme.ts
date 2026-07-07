import { createTheme } from '@mui/material/styles'

// Minimal MUI theme so MUI's *unstyled* defaults (focus rings, ripple, menu/paper surfaces, Alert colors)
// inherit our dark palette instead of MUI's light defaults — reducing per-component overrides. Component
// specifics are still owned by each App* wrapper's CSS Module (via injectFirst). Colors mirror the hex in
// styles/vars.css; keep them in sync (MUI needs JS color values, so this is the one place they're duplicated).
// No CssBaseline is used — global.css owns the body reset/background.
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' }, // --accent
    error: { main: '#ef4444' }, // --decision-escalate
    warning: { main: '#f97316' }, // --decision-route
    success: { main: '#22c55e' }, // --decision-answer
    background: { default: '#0f1117', paper: '#1a1d27' }, // --bg-base / --bg-panel
    text: { primary: '#e2e8f0', secondary: '#64748b' }, // --text / --text-muted
    divider: '#2d3148' // --border
  },
  shape: { borderRadius: 6 }
})
