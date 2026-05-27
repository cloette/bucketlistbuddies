import { Link, NavLink } from 'react-router-dom'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import {
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'
import NotificationPanel from '../notifications/NotificationPanel'

const NAV_LINKS = [
  { to: '/browse',   label: 'Browse',   end: true  },
]

const NAV_LINKS2 = [
  { to: '/my-list',  label: 'My List',  end: false },
  { to: '/messages', label: 'Messages', end: false },
]

export default function TopNav() {
  const { user, profile, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()

  const initial = (profile?.display_name || profile?.username || user?.email || '?')[0].toUpperCase()

  return (
    <nav className="hidden md:flex items-center gap-6 px-6 h-14 bg-indigo-brand text-white shrink-0">
      <Link to="/" className="font-bold text-canary text-lg tracking-wide mr-2">
        Bucket List Buddies
      </Link>

      {NAV_LINKS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive
              ? 'text-canary font-medium'
              : 'text-white/75 hover:text-white transition-colors'
          }
        >
          {label}
        </NavLink>
      ))}
      { user ? (
      NAV_LINKS2.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive
              ? 'text-canary font-medium'
              : 'text-white/75 hover:text-white transition-colors'
          }
        >
          {label}
        </NavLink>
        )
        : null
      }

      <div className="ml-auto flex items-center gap-2">
        {user && <NotificationPanel iconClassName="text-white" />}
        {user ? (
          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
              <div className="w-8 h-8 bg-lavender/30 rounded-full flex items-center justify-center text-sm font-bold">
                {initial}
              </div>
              <span className="text-sm">{profile?.display_name || profile?.username}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </MenuButton>

            <MenuItems
              anchor="bottom end"
              className="w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-1 z-50 [--anchor-gap:8px] focus:outline-none"
            >
              <MenuItem>
                <Link
                  to={`/profile/${profile?.username}`}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-50"
                >
                  <UserIcon className="w-4 h-4 text-dim-grey" />
                  Profile
                </Link>
              </MenuItem>
              <MenuItem>
                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-50"
                >
                  <Cog6ToothIcon className="w-4 h-4 text-dim-grey" />
                  Settings
                </Link>
              </MenuItem>
              <div className="my-1 border-t border-gray-100" />
              <MenuItem>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 data-[focus]:bg-red-50"
                >
                  <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                  Sign out
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={openAuthModal}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={openAuthModal}
              className="text-sm bg-canary text-indigo-brand font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Create account
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
