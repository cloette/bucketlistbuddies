import { createContext, useContext, useState } from 'react'
import AuthModal from '../components/auth/AuthModal'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AuthModalContext.Provider value={{ openAuthModal: () => setIsOpen(true) }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => useContext(AuthModalContext)
