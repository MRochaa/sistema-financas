// Importações principais do React e ReactDOM
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'  // Mudado de App.tsx para App.jsx
import './index.css'  // IMPORTANTE: Importar o CSS com Tailwind

// Monta a aplicação React no elemento com id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
