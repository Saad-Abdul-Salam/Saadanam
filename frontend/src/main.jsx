import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { isDemoMode } from './demo/demoServer.js'
import DemoShopApp from './demo/DemoShopApp.jsx'
import App from './App.jsx'
import './index.css'

// The free landing-page demo runs OUTSIDE the main BrowserRouter: it mounts
// its own MemoryRouter (the two routers must never nest). All demo data lives
// in browser memory — nothing is saved to the backend or database, and it all
// disappears when the page is reloaded or the demo is exited.
const wantsDemo =
    isDemoMode() ||
    new URLSearchParams(window.location.search).has('demo')

// Remove the animated splash from index.html once the app has mounted.
const splash = document.getElementById('splash')
if (splash) {
    splash.classList.add('splash-hide')
    setTimeout(() => splash.remove(), 350)
}

ReactDOM.createRoot(document.getElementById('root')).render(    <React.StrictMode>
        <ThemeProvider>
            <ToastProvider>
                {wantsDemo ? (
                    <DemoShopApp onExit={() => window.location.assign('/')} />
                ) : (
                    <BrowserRouter>
                        <AuthProvider>
                            <DataProvider>
                                <App />
                            </DataProvider>
                        </AuthProvider>
                    </BrowserRouter>
                )}
            </ToastProvider>
        </ThemeProvider>
    </React.StrictMode>
)