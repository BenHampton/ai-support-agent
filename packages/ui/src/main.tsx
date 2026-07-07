import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StyledEngineProvider } from '@mui/material/styles'
import './styles/global.css'
import { App } from './App'

// injectFirst puts MUI's Emotion styles ahead of our CSS in <head>, so our CSS Modules reliably override
// MUI defaults without specificity hacks (needed for the AppSelect* wrappers styled via CSS Modules)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider injectFirst>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StyledEngineProvider>
  </StrictMode>
)
