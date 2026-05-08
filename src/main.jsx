import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DialogProvider from './ui/DialogProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </React.StrictMode>,
)
 
