import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { SocketProvider } from './contexts/SocketContext'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import BrowseIdeas from './pages/BrowseIdeas'
import MyBucketList from './pages/MyBucketList'
import MessagesPage from './pages/MessagesPage'
import SettingsPage from './pages/SettingsPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthModalProvider>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="browse" element={<BrowseIdeas />} />
                  <Route path="my-list" element={<MyBucketList />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="messages/:partnerId" element={<MessagesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </AuthModalProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
