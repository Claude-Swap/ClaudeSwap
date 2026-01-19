import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { WalletContextProvider } from './components/WalletProvider.tsx'
import './index.css'
import './styles/colors.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </React.StrictMode>,
)

