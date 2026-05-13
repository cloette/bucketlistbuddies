import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'
import NotificationPanel from '../notifications/NotificationPanel'

export default function MobileHeader() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  return (
    <header className="md:hidden flex items-center justify-between px-4 h-12 bg-indigo-brand text-white shrink-0">
      <Link to="/" className="font-bold text-canary text-base tracking-wide">
        Bucket List Buddies
      </Link>
      {user ? (
        <NotificationPanel iconClassName="text-white" />
      ) : (
        <button
          onClick={openAuthModal}
          className="text-sm font-semibold text-indigo-brand bg-canary px-3 py-1 rounded-md hover:opacity-90 transition-opacity"
        >
          Sign in
        </button>
      )}
    </header>
  )
}
