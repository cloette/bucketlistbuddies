import { Dialog, DialogPanel } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import {
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

export default function MobileProfileMenu({ isOpen, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  function go(path) {
    onClose()
    navigate(path)
  }

  async function handleSignOut() {
    onClose()
    await signOut()
    navigate('/')
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      transition
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 transition duration-200 ease-out data-[closed]:opacity-0" />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0">
        <DialogPanel
          transition
          className="bg-white rounded-t-2xl px-4 pt-3 pb-10 transition duration-300 ease-out data-[closed]:translate-y-full"
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* User info */}
          {profile && (
            <div className="px-2 pb-3 mb-1 border-b border-gray-100">
              <p className="font-semibold text-gray-900">
                {profile.display_name || profile.username}
              </p>
              <p className="text-sm text-dim-grey">@{profile.username}</p>
            </div>
          )}

          <button
            onClick={() => go(`/profile/${profile?.username}`)}
            className="w-full flex items-center gap-3 px-2 py-3 text-left text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserIcon className="w-5 h-5 text-dim-grey" />
            Profile
          </button>

          <button
            onClick={() => go('/settings')}
            className="w-full flex items-center gap-3 px-2 py-3 text-left text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5 text-dim-grey" />
            Settings
          </button>

          <div className="my-1 border-t border-gray-100" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-2 py-3 text-left text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            Sign out
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
