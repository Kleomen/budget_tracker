import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

/* App entry point — referenced by index.html as /src/main.jsx.
   Wrapping App in <BrowserRouter> enables the URL-based routing
   (/dashboard, /transactions, /budgets, /login, /signup). */
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
