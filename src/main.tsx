import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Acceso from './components/Acceso'
import { iniciarTema } from './lib/tema'

iniciarTema()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Acceso>
      <App />
    </Acceso>
  </StrictMode>,
)
