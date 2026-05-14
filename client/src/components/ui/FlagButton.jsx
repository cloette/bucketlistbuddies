import { useState } from 'react'
import { FlagIcon } from '@heroicons/react/24/outline'
import { FlagIcon as FlagSolid } from '@heroicons/react/24/solid'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'

export default function FlagButton({ ideaId, postId, commentId, targetUserId, className = '' }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [state, setState] = useState('idle') // idle | pending | done

  async function handleFlag() {
    if (!user) { openAuthModal(); return }
    if (state !== 'idle') return
    setState('pending')

    const body = {}
    if (ideaId)        body.idea_id        = ideaId
    if (postId)        body.post_id        = postId
    if (commentId)     body.comment_id     = commentId
    if (targetUserId)  body.target_user_id = targetUserId

    const res = await apiFetch('/api/flags', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    // 409 = already reported — treat as success from the user's perspective
    setState(res.ok || res.status === 409 ? 'done' : 'idle')
  }

  if (state === 'done') {
    return (
      <span className={`flex items-center gap-1 text-xs text-red-400 ${className}`}>
        <FlagSolid className="w-3.5 h-3.5" />
        Reported
      </span>
    )
  }

  return (
    <button
      onClick={handleFlag}
      disabled={state === 'pending'}
      title="Report this content"
      className={`flex items-center gap-1 text-xs text-dim-grey hover:text-red-500 transition-colors disabled:opacity-50 ${className}`}
    >
      <FlagIcon className="w-3.5 h-3.5" />
      {state === 'pending' ? 'Reporting…' : 'Report'}
    </button>
  )
}
