import { useState } from 'react'
import {
  BookmarkIcon,
  GlobeAltIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import FlagButton from './FlagButton'

export default function IdeaCard({ idea, isInList, isSaved, onToggleList, onToggleSave, onOpenForum }) {
  const { user } = useAuth()
  const [listPending, setListPending] = useState(false)
  const [savePending, setSavePending] = useState(false)

  async function handleToggleList() {
    if (!user || listPending) return
    setListPending(true)
    await onToggleList(idea.id, isInList)
    setListPending(false)
  }

  async function handleToggleSave() {
    if (!user || savePending) return
    setSavePending(true)
    await onToggleSave(idea.id, isSaved)
    setSavePending(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 leading-snug">{idea.title}</h3>
        {user && (
          <button
            onClick={handleToggleSave}
            disabled={savePending}
            aria-label={isSaved ? 'Unsave idea' : 'Save idea'}
            className={`shrink-0 transition-colors disabled:opacity-50 ${
              isSaved ? 'text-indigo-brand' : 'text-dim-grey hover:text-indigo-brand'
            }`}
          >
            {isSaved
              ? <BookmarkSolid className="w-5 h-5" />
              : <BookmarkIcon className="w-5 h-5" />
            }
          </button>
        )}
      </div>

      {/* Description */}
      {idea.description && (
        <p className="text-sm text-dim-grey line-clamp-2">{idea.description}</p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {idea.categories?.name && (
          <span className="text-xs font-medium bg-lavender/20 text-indigo-brand px-2.5 py-0.5 rounded-full">
            {idea.categories.name}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-dim-grey">
          <GlobeAltIcon className="w-3.5 h-3.5 shrink-0" />
          {idea.country === 'anywhere' ? 'Anywhere' : idea.country}
        </span>
      </div>

      {/* Footer: stats + add button */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-dim-grey">
          <span>{idea.add_count} added</span>
          <button
            onClick={() => onOpenForum?.(idea)}
            className="flex items-center gap-1 hover:text-indigo-brand transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 shrink-0" />
            {idea.forum_count > 0
              ? `${idea.forum_count} ${idea.forum_count === 1 ? 'thread' : 'threads'}`
              : 'Discussion'}
          </button>
          {user && <FlagButton ideaId={idea.id} />}
        </div>

        {user ? (
          <button
            onClick={handleToggleList}
            disabled={listPending}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
              isInList
                ? 'bg-indigo-brand text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-brand hover:text-white'
            }`}
          >
            {isInList
              ? <><CheckCircleIcon className="w-4 h-4" /> Added</>
              : <><PlusCircleIcon className="w-4 h-4" /> Add</>
            }
          </button>
        ) : (
          <span className="text-xs text-dim-grey italic">Sign in to add</span>
        )}
      </div>
    </div>
  )
}
