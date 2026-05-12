import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '../../contexts/NotificationContext'

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function notificationText(n) {
  const actor = n.actor?.display_name || n.actor?.username || 'Someone'
  switch (n.type) {
    case 'idea_commented':  return `${actor} started a discussion on your idea`
    case 'comment_replied': return `${actor} commented on a post you're following`
    case 'dm_received':     return `${actor} sent you a message`
    default:                return 'New notification'
  }
}

export default function NotificationPanel({ iconClassName = 'text-white' }) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <Popover className="relative">
      <PopoverButton className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors focus:outline-none">
        <BellIcon className={`w-5 h-5 ${iconClassName}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        transition
        className="w-80 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 z-50 [--anchor-gap:8px] focus:outline-none transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:scale-95"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-brand hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <p className="text-sm text-dim-grey text-center py-8">No notifications yet</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 ${!n.read ? 'bg-indigo-brand/5' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{notificationText(n)}</p>
                  <p className="text-xs text-dim-grey mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 bg-indigo-brand rounded-full mt-1.5 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverPanel>
    </Popover>
  )
}
