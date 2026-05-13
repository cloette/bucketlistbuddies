import { useState, useEffect } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import {
  XMarkIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'

const INPUT = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/40'

function timeAgo(dateString) {
  const mins = Math.floor((Date.now() - new Date(dateString)) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Thread list ─────────────────────────────────────────────────────────────

function ThreadList({ posts, loading, onNewThread }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm">Discussion</h3>
        <button
          onClick={onNewThread}
          className="text-sm font-semibold bg-indigo-brand text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          + New thread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-sm text-dim-grey py-10">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
            <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium text-gray-700">No discussions yet</p>
            <p className="text-xs text-dim-grey">Be the first to start a conversation about this idea.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {posts.map(post => (
              <li key={post.id} className="px-4 py-4">
                <p className="font-semibold text-gray-900 text-sm leading-snug">{post.title}</p>
                {post.body && (
                  <p className="text-sm text-dim-grey mt-1 line-clamp-2 leading-relaxed">{post.body}</p>
                )}
                <p className="text-xs text-dim-grey mt-2">
                  {post.comment_count > 0 && (
                    <span className="mr-2">{post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'} ·</span>
                  )}
                  {timeAgo(post.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── New thread form ─────────────────────────────────────────────────────────

function NewThreadForm({ ideaId, onSuccess, onBack }) {
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await apiFetch('/api/forum/posts', {
      method: 'POST',
      body: JSON.stringify({ idea_id: ideaId, title: title.trim(), body: body.trim() }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to create thread.')
      return
    }

    onSuccess()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-dim-grey hover:text-gray-900 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-gray-900 text-sm">New thread</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What do you want to discuss?"
            required
            maxLength={120}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your thoughts, tips, or questions…"
            required
            maxLength={2000}
            rows={5}
            className={INPUT + ' resize-none'}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? 'Posting…' : 'Post thread'}
        </button>
      </form>
    </div>
  )
}

// ─── ForumModal ───────────────────────────────────────────────────────────────

export default function ForumModal({ idea, isOpen, onClose }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [view, setView]     = useState('list')
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !idea) return
    setView('list')
    loadPosts()
  }, [isOpen, idea?.id])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('forum_posts')
      .select('id, title, body, comment_count, created_at')
      .eq('idea_id', idea.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  function handleNewThread() {
    if (!user) { openAuthModal(); return }
    setView('new')
  }

  function handleThreadCreated() {
    setView('list')
    loadPosts()
  }

  if (!idea) return null

  return (
    <Dialog open={isOpen} onClose={onClose} transition className="relative z-50">
      <div className="fixed inset-0 bg-black/50 transition duration-200 ease-out data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="bg-white w-full sm:max-w-lg flex flex-col h-[80vh] sm:h-[520px] sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
        >
          {/* Modal header */}
          <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-medium text-dim-grey uppercase tracking-wide">Idea</p>
              <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{idea.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-dim-grey hover:text-gray-900 transition-colors shrink-0 mt-0.5"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* View content */}
          {view === 'list' ? (
            <ThreadList posts={posts} loading={loading} onNewThread={handleNewThread} />
          ) : (
            <NewThreadForm ideaId={idea.id} onSuccess={handleThreadCreated} onBack={() => setView('list')} />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
