import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DialogProvider from './ui/DialogProvider.jsx'
import { RankingProvider } from './ui/RankingProvider.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DialogProvider>
      <RankingProvider>
        <App />
      </RankingProvider>
    </DialogProvider>
  </React.StrictMode>,
)
 
