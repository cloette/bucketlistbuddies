import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FlagButton from '../components/ui/FlagButton'

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile]       = useState(null)
  const [items, setItems]           = useState(null)  // null = inaccessible
  const [listPublic, setListPublic] = useState(false)
  const [ideasCount, setIdeasCount] = useState(0)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setNotFound(false)
      setItems(null)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle()

      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      // Bucket list (RLS: owner always sees it; others only see public)
      const { data: list } = await supabase
        .from('bucket_lists')
        .select('id, visibility')
        .eq('user_id', prof.id)
        .maybeSingle()

      if (list) {
        setListPublic(list.visibility === 'public')
        const { data: rows } = await supabase
          .from('bucket_list_items')
          .select('id, is_completed, display_order, ideas(id, title, country, categories(name))')
          .eq('bucket_list_id', list.id)
          .order('display_order', { ascending: true })
        setItems(rows ?? [])
      }

      // Ideas submitted count (always public for active ideas)
      const { count } = await supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .eq('submitted_by', prof.id)
        .eq('status', 'active')
      setIdeasCount(count ?? 0)

      setLoading(false)
    }
    load()
  }, [username])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-dim-grey text-sm">
        Loading…
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 gap-2">
        <p className="text-2xl font-bold text-gray-900">User not found</p>
        <p className="text-sm text-dim-grey">No one goes by @{username}.</p>
      </div>
    )
  }

  const isOwnProfile   = user?.id === profile.id
  const displayName    = profile.display_name || profile.username
  const initial        = displayName[0].toUpperCase()
  const completedCount = items?.filter(i => i.is_completed).length ?? 0
  const totalCount     = items?.length ?? 0
  const showItems      = items !== null
  const listIsPrivate  = showItems && !listPublic && isOwnProfile

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-lavender/30 flex items-center justify-center text-2xl font-bold text-indigo-brand shrink-0">
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h1>
          <p className="text-sm text-dim-grey">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {isOwnProfile ? (
            <Link
              to="/settings"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit profile
            </Link>
          ) : (
            <>
              {user && profile.allow_dms && (
                <button
                  onClick={() => navigate(`/messages/${profile.id}`)}
                  className="text-sm bg-indigo-brand text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Message
                </button>
              )}
              {user && (
                <FlagButton targetUserId={profile.id} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {showItems ? (
          <>
            <StatCard value={totalCount}     label="on their list" />
            <StatCard value={completedCount} label="completed" />
          </>
        ) : (
          <>
            <StatCard value="—" label="on their list" />
            <StatCard value="—" label="completed" />
          </>
        )}
        <StatCard value={ideasCount} label={ideasCount === 1 ? 'idea submitted' : 'ideas submitted'} />
      </div>

      {/* Bucket list section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            {isOwnProfile
              ? 'Your Bucket List'
              : `${displayName.split(' ')[0]}'s Bucket List`}
          </h2>
          {listIsPrivate && (
            <span className="text-xs font-medium text-dim-grey border border-gray-200 rounded-full px-2 py-0.5">
              Private
            </span>
          )}
        </div>

        {!showItems ? (
          <div className="flex items-center gap-2 text-dim-grey text-sm py-6">
            <LockClosedIcon className="w-4 h-4 shrink-0" />
            <span>This bucket list is private.</span>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-dim-grey py-6">
            {isOwnProfile
              ? "You haven't added anything yet. Browse ideas to get started."
              : 'No items on this list yet.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map(item => (
              <li
                key={item.id}
                className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm ring-1 ring-black/5 ${
                  item.is_completed ? 'opacity-60' : ''
                }`}
              >
                <CheckCircleIcon
                  className={`w-5 h-5 shrink-0 ${item.is_completed ? 'text-green-500' : 'text-gray-200'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    item.is_completed ? 'line-through text-dim-grey' : 'text-gray-800'
                  }`}>
                    {item.ideas?.title}
                  </p>
                  <p className="text-xs text-dim-grey mt-0.5">
                    {[
                      item.ideas?.categories?.name,
                      item.ideas?.country && item.ideas.country !== 'anywhere'
                        ? item.ideas.country : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 shadow-sm px-4 py-3 text-center">
      <p className="text-2xl font-bold text-indigo-brand">{value}</p>
      <p className="text-xs text-dim-grey mt-0.5">{label}</p>
    </div>
  )
}
