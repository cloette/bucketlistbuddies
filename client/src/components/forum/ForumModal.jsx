import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import {
  XMarkIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'
import FlagButton from '../ui/FlagButton'

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

function ThreadList({ posts, loading, onNewThread, onSelectThread }) {
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
            {posts.map(post => {
              const author = post.profiles?.display_name || post.profiles?.username || 'Unknown'
              return (
                <li
                  key={post.id}
                  onClick={() => onSelectThread(post)}
                  className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{post.title}</p>
                  {post.body && (
                    <p className="text-sm text-dim-grey mt-1 line-clamp-2 leading-relaxed">{post.body}</p>
                  )}
                  <p className="text-xs text-dim-grey mt-2">
                    <a href={`/profile/${post.profiles?.username}`} target="_blank" rel="noopener noreferrer" className="text-purple-brand hover:underline">
                      {author}
                    </a>
                    {post.comment_count > 0 && (
                      <span> · {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}</span>
                    )}
                    <span> · {timeAgo(post.created_at)}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Thread view ─────────────────────────────────────────────────────────────

function ThreadView({ postId, onBack, onDeleted }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [thread, setThread]     = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [commentError, setCommentError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: post }, { data: cmts }] = await Promise.all([
        supabase
          .from('forum_posts')
          .select('id, title, body, created_at, user_id, profiles(display_name, username)')
          .eq('id', postId)
          .single(),
        supabase
          .from('forum_comments')
          .select('id, body, created_at, user_id, profiles(display_name, username)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true }),
      ])
      setThread(post)
      setComments(cmts ?? [])
      setLoading(false)
    }
    load()
  }, [postId])

  async function handleDeleteThread() {
    if (!window.confirm('Delete this thread? This cannot be undone.')) return
    const res = await apiFetch(`/api/forum/posts/${postId}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) onDeleted(postId)
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) return
    const res = await apiFetch(`/api/forum/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault()
    if (!user) { openAuthModal(); return }
    if (!commentBody.trim()) return
    setCommentError('')
    setSubmitting(true)

    const res = await apiFetch(`/api/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: commentBody.trim() }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setCommentError(json.error ?? 'Failed to post comment.')
      return
    }

    const newComment = await res.json()
    // Attach current user's profile info for immediate display
    newComment.user_id = user.id
    newComment.profiles = {
      display_name: user.user_metadata?.display_name || null,
      username: user.user_metadata?.username || null,
    }
    setComments(prev => [...prev, newComment])
    setCommentBody('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center">
        <p className="text-sm text-dim-grey">Loading…</p>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center">
        <p className="text-sm text-dim-grey">Thread not found.</p>
      </div>
    )
  }

  const threadAuthor = thread.profiles?.display_name || thread.profiles?.username || 'Unknown'
  const isThreadOwner = user?.id === thread.user_id

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-dim-grey hover:text-gray-900 transition-colors shrink-0">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <p className="font-semibold text-gray-900 text-sm truncate flex-1">{thread.title}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Thread body */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-xs text-dim-grey">
              <a href={`/profile/${thread.profiles?.username}`} target="_blank" rel="noopener noreferrer" className="text-purple-brand hover:underline">
                {threadAuthor}
              </a>
              {threadAuthor} · {timeAgo(thread.created_at)}
            </p>
            <div className="flex items-center gap-2 ml-auto">
              {isThreadOwner ? (
                <button
                  onClick={handleDeleteThread}
                  className="flex items-center gap-1 text-xs text-dim-grey hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              ) : (
                <FlagButton postId={thread.id} />
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <ul className="divide-y divide-gray-50">
            {comments.map(comment => {
              const commentAuthor = comment.profiles?.display_name || comment.profiles?.username || 'Unknown'
              const isCommentOwner = user?.id === comment.user_id
              return (
                <li key={comment.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-gray-700">
                      <a href={`/profile/${comment.profiles?.username}`} target="_blank" rel="noopener noreferrer" className="text-purple-brand hover:underline">
                        {commentAuthor}
                      </a>
                       · {timeAgo(comment.created_at)}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {isCommentOwner ? (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="flex items-center gap-1 text-xs text-dim-grey hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                          Delete
                        </button>
                      ) : (
                        <FlagButton commentId={comment.id} />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed">{comment.body}</p>
                  <p className="text-xs text-dim-grey mt-1">{timeAgo(comment.created_at)}</p>
                </li>
              )
            })}
          </ul>
        )}

        {comments.length === 0 && (
          <p className="text-center text-xs text-dim-grey py-6">No replies yet. Be the first!</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmitComment} className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
        {commentError && <p className="text-xs text-red-500 mb-2">{commentError}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            placeholder={user ? 'Write a reply…' : 'Sign in to reply…'}
            maxLength={1000}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/40"
          />
          <button
            type="submit"
            disabled={submitting || !commentBody.trim()}
            className="bg-indigo-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {submitting ? '…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── New thread form ─────────────────────────────────────────────────────────

function NewThreadForm({ ideaId, onSuccess, onBack }) {
  const [title, setTitle]     = useState('')
  const [body, setBody]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

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
  const [view, setView]               = useState('list')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    if (!isOpen || !idea) return
    setView('list')
    setSelectedPostId(null)
    loadPosts()
  }, [isOpen, idea?.id])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('forum_posts')
      .select('id, title, body, comment_count, created_at, user_id, profiles(display_name, username)')
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

  function handleSelectThread(post) {
    setSelectedPostId(post.id)
    setView('thread')
  }

  function handleThreadCreated() {
    setView('list')
    loadPosts()
  }

  function handleThreadDeleted(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
    setView('list')
  }

  if (!idea) return null

  return (
    <Dialog open={isOpen} onClose={onClose} transition className="relative z-50">
      <div className="fixed inset-0 bg-black/50 transition duration-200 ease-out data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="bg-white w-full sm:max-w-lg flex flex-col h-[80vh] sm:h-[560px] sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
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
          {view === 'list' && (
            <ThreadList
              posts={posts}
              loading={loading}
              onNewThread={handleNewThread}
              onSelectThread={handleSelectThread}
            />
          )}
          {view === 'new' && (
            <NewThreadForm
              ideaId={idea.id}
              onSuccess={handleThreadCreated}
              onBack={() => setView('list')}
            />
          )}
          {view === 'thread' && selectedPostId && (
            <ThreadView
              postId={selectedPostId}
              onBack={() => setView('list')}
              onDeleted={handleThreadDeleted}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
