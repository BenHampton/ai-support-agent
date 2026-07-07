import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import './styles/global.css'
import { App } from './App'
import { theme } from './theme'

// injectFirst puts MUI's Emotion styles ahead of our CSS in <head>, so our CSS Modules reliably override
// MUI defaults without specificity hacks. ThemeProvider gives MUI's unstyled defaults our dark palette
// (no CssBaseline — global.css owns the body reset/background).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>
)
