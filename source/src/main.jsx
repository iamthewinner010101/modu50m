import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './EntryApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<p role="status">모두의 50m을 준비하고 있어요…</p>}><App /></Suspense>
  </StrictMode>,
)
