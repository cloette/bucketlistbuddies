import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useNotifications } from '../contexts/NotificationContext'

// ─── Helpers ────────────────────────────────────────────────────────────────

const WARNING_STORAGE_KEY = 'blb_dm_warned'

function getWarnedSet(userId) {
  try {
    const raw = localStorage.getItem(`${WARNING_STORAGE_KEY}:${userId}`)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function setWarned(userId, partnerId) {
  const set = getWarnedSet(userId)
  set.add(partnerId)
  localStorage.setItem(`${WARNING_STORAGE_KEY}:${userId}`, JSON.stringify([...set]))
}

function partnerName(profile) {
  return profile?.display_name || profile?.username || 'User'
}

function timeLabel(dateString) {
  const d = new Date(dateString)
  const now = new Date()
  const diffMins = Math.floor((now - d) / 60000)
  if (diffMins < 1)  return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const hrs = Math.floor(diffMins / 60)
  if (hrs < 24)      return `${hrs}h`
  if (d.getFullYear() === now.getFullYear())
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return d.toLocaleDateString()
}

// ─── ConversationList ────────────────────────────────────────────────────────

function ConversationList({ conversations, activePartnerId, loading }) {
  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-dim-grey text-sm">Loading…</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 text-center">
        <p className="text-sm text-dim-grey">No conversations yet.</p>
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
      {conversations.map(({ partnerId, profile, lastMessage, unread }) => (
        <li key={partnerId}>
          <Link
            to={`/messages/${partnerId}`}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
              partnerId === activePartnerId ? 'bg-indigo-brand/5 border-l-2 border-indigo-brand' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-lavender/30 flex items-center justify-center text-sm font-bold text-indigo-brand shrink-0">
              {partnerName(profile)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {partnerName(profile)}
                </span>
                <span className="text-xs text-dim-grey shrink-0">
                  {timeLabel(lastMessage.created_at)}
                </span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${unread ? 'text-gray-700 font-medium' : 'text-dim-grey'}`}>
                {lastMessage.content}
              </p>
            </div>
            {unread && <div className="w-2 h-2 bg-indigo-brand rounded-full shrink-0" />}
          </Link>
        </li>
      ))}
    </ul>
  )
}

// ─── ConversationThread ──────────────────────────────────────────────────────

function ConversationThread({ partnerId, profile, currentUserId }) {
  const socket = useSocket()
  const { markDmRead } = useNotifications()
  const [messages, setMessages]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [sendError, setSendError]   = useState('')
  const [showWarning, setShowWarning] = useState(false)
  const bottomRef = useRef(null)

  // Scam/safety warning — shown once per unique conversation
  useEffect(() => {
    if (!currentUserId || !partnerId) return
    if (!getWarnedSet(currentUserId).has(partnerId)) setShowWarning(true)
  }, [currentUserId, partnerId])

  function dismissWarning() {
    setWarned(currentUserId, partnerId)
    setShowWarning(false)
  }

  // Fetch thread
  useEffect(() => {
    setMessages([])
    setLoading(true)
    setInput('')
    setSendError('')
    apiFetch(`/api/messages/${partnerId}`)
      .then(r => r.json())
      .then(data => { setMessages(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [partnerId])

  // Mark incoming messages as read + clear DM notifications for this partner
  useEffect(() => {
    if (!partnerId || loading) return
    apiFetch(`/api/messages/${partnerId}/read`, { method: 'PATCH' }).catch(() => {})
    markDmRead(partnerId)
  }, [partnerId, loading])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time incoming messages
  useEffect(() => {
    if (!socket) return
    function onDmNew(msg) {
      const isThisConversation =
        (msg.sender_id === partnerId   && msg.recipient_id === currentUserId) ||
        (msg.sender_id === currentUserId && msg.recipient_id === partnerId)
      if (!isThisConversation) return
      setMessages(prev => [...prev, msg])
      if (msg.sender_id === partnerId) {
        apiFetch(`/api/messages/${partnerId}/read`, { method: 'PATCH' }).catch(() => {})
        markDmRead(partnerId)
      }
    }
    socket.on('dm:new', onDmNew)
    return () => socket.off('dm:new', onDmNew)
  }, [socket, partnerId, currentUserId, markDmRead])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSendError('')
    setSending(true)

    const res = await apiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: partnerId, content: text }),
    })
    setSending(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setSendError(json.error ?? 'Failed to send.')
      return
    }

    const msg = await res.json()
    if (!msg.dropped) setMessages(prev => [...prev, msg])
    setInput('')
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Safety warning */}
      {showWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3 shrink-0">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Stay safe</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Be cautious with people you haven't met in person. Never share financial details or personal information with strangers online.
            </p>
          </div>
          <button
            onClick={dismissWarning}
            className="text-xs font-medium text-amber-600 hover:text-amber-800 shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-dim-grey pt-8">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-dim-grey pt-8">No messages yet. Say hello!</p>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-indigo-brand text-white rounded-br-sm'
                      : 'bg-white ring-1 ring-black/5 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                  <div className={`text-[10px] mt-0.5 ${isMine ? 'text-white/60' : 'text-dim-grey'}`}>
                    {timeLabel(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message…"
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-full bg-indigo-brand text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
        {sendError && <p className="text-xs text-red-500 px-5 pb-2">{sendError}</p>}
      </div>
    </div>
  )
}

// ─── MessagesPage ────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { partnerId } = useParams()
  const { user } = useAuth()
  const socket = useSocket()
  const [conversations, setConversations] = useState([])
  const [profiles, setProfiles]           = useState({})
  const [loadingConvs, setLoadingConvs]   = useState(true)

  const fetchConversations = useCallback(async () => {
    const res = await apiFetch('/api/messages/conversations')
    if (!res.ok) return
    const data = await res.json()
    setConversations(data)

    const ids = data.map(c => c.partnerId)
    if (ids.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', ids)
      if (profileRows) {
        const map = {}
        for (const p of profileRows) map[p.id] = p
        setProfiles(prev => ({ ...prev, ...map }))
      }
    }
    setLoadingConvs(false)
  }, [])

  useEffect(() => {
    if (!user) return
    fetchConversations()
  }, [user, fetchConversations])

  // Fetch profile for the active partner if we don't have it (e.g., navigated directly)
  useEffect(() => {
    if (!partnerId || profiles[partnerId]) return
    supabase
      .from('profiles')
      .select('id, display_name, username')
      .eq('id', partnerId)
      .single()
      .then(({ data }) => {
        if (data) setProfiles(prev => ({ ...prev, [data.id]: data }))
      })
  }, [partnerId, profiles])

  // Update conversation list when a new DM arrives in a different thread
  useEffect(() => {
    if (!socket) return
    function onDmNew(msg) {
      const partner = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id
      setConversations(prev => {
        const existing = prev.find(c => c.partnerId === partner)
        if (existing) {
          return [
            { ...existing, lastMessage: msg, unread: msg.sender_id !== user?.id },
            ...prev.filter(c => c.partnerId !== partner),
          ]
        }
        // Brand-new conversation partner — refresh the full list
        fetchConversations()
        return prev
      })
    }
    socket.on('dm:new', onDmNew)
    return () => socket.off('dm:new', onDmNew)
  }, [socket, user, fetchConversations])

  const convList = conversations.map(c => ({
    ...c,
    profile: profiles[c.partnerId],
  }))

  const activeProfile = profiles[partnerId]

  // Mobile: show list when no partner selected, show thread otherwise
  const showList   = !partnerId
  const showThread = !!partnerId

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-3.5rem)] bg-white overflow-hidden">
      {/* Sidebar — conversation list */}
      <aside
        className={`${showList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-gray-100 shrink-0`}
      >
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
        <ConversationList
          conversations={convList}
          activePartnerId={partnerId}
          loading={loadingConvs}
        />
      </aside>

      {/* Thread panel */}
      {showThread ? (
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
            <Link to="/messages" className="md:hidden text-dim-grey">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-lavender/30 flex items-center justify-center text-sm font-bold text-indigo-brand shrink-0">
              {partnerName(activeProfile)[0].toUpperCase()}
            </div>
            <span className="font-semibold text-sm text-gray-900">{partnerName(activeProfile)}</span>
          </div>
          <ConversationThread
            key={partnerId}
            partnerId={partnerId}
            profile={activeProfile}
            currentUserId={user?.id}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-sm text-dim-grey">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  )
}
