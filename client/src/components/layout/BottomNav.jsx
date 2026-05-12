import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  MagnifyingGlassIcon,
  QueueListIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  QueueListIcon as QueueListSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolid,
} from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import MobileProfileMenu from './MobileProfileMenu'

const LOGGED_OUT_ITEMS = [
  { to: '/', label: 'Home', Icon: HomeIcon, ActiveIcon: HomeSolid, end: true },
  { to: '/browse', label: 'Browse', Icon: MagnifyingGlassIcon, ActiveIcon: MagnifyingGlassSolid, end: true },
]

const LOGGED_IN_ITEMS = [
  { to: '/browse',   label: 'Browse',    Icon: MagnifyingGlassIcon,         ActiveIcon: MagnifyingGlassSolid,         end: true  },
  { to: '/my-list',  label: 'My List',   Icon: QueueListIcon,               ActiveIcon: QueueListSolid,               end: false },
  { to: '/messages', label: 'Messages',  Icon: ChatBubbleLeftRightIcon,      ActiveIcon: ChatBubbleLeftRightSolid,     end: false, badge: true },
]

export default function BottomNav() {
  const { user, profile } = useAuth()
  const { dmUnreadCount } = useNotifications()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const items = user ? LOGGED_IN_ITEMS : LOGGED_OUT_ITEMS
  const initial = (profile?.display_name || profile?.username || '?')[0].toUpperCase()

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-40">
        {items.map(({ to, label, Icon, ActiveIcon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className="flex-1">
            {({ isActive }) => (
              <span className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-indigo-brand' : 'text-dim-grey'
              }`}>
                <span className="relative">
                  {isActive ? <ActiveIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  {badge && dmUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
                      {dmUnreadCount > 9 ? '9+' : dmUnreadCount}
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium">{label}</span>
              </span>
            )}
          </NavLink>
        ))}

        {/* Profile button — logged-in only */}
        {user && (
          <button
            onClick={() => setProfileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-dim-grey"
          >
            <div className="w-6 h-6 rounded-full bg-lavender/30 flex items-center justify-center text-xs font-bold text-indigo-brand">
              {initial}
            </div>
            <span className="text-xs font-medium">Profile</span>
          </button>
        )}
      </nav>

      {user && (
        <MobileProfileMenu
          isOpen={profileMenuOpen}
          onClose={() => setProfileMenuOpen(false)}
        />
      )}
    </>
  )
}
