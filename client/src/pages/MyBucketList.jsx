import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  CheckIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export default function MyBucketList() {
  const { user, loading: authLoading } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [bucketListId, setBucketListId] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    loadList()
  }, [user, authLoading])

  async function loadList() {
    setLoading(true)

    const { data: bl } = await supabase
      .from('bucket_lists')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!bl) { setItems([]); setLoading(false); return }

    setBucketListId(bl.id)

    const { data } = await supabase
      .from('bucket_list_items')
      .select('id, idea_id, display_order, is_completed, ideas(id, title, country, categories(name))')
      .eq('bucket_list_id', bl.id)
      .order('display_order', { ascending: true })

    setItems(data ?? [])
    setLoading(false)
  }

  async function toggleCompleted(item) {
    const next = !item.is_completed
    await supabase.from('bucket_list_items').update({ is_completed: next }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: next } : i))
  }

  async function removeItem(item) {
    await supabase.from('bucket_list_items').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  async function moveItem(index, direction) {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= items.length) return

    const a = items[index]
    const b = items[swapIndex]

    await Promise.all([
      supabase.from('bucket_list_items').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('bucket_list_items').update({ display_order: a.display_order }).eq('id', b.id),
    ])

    setItems(prev => {
      const next = [...prev]
      next[index] = { ...a, display_order: b.display_order }
      next[swapIndex] = { ...b, display_order: a.display_order }
      return next.sort((x, y) => x.display_order - y.display_order)
    })
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to see your list</h2>
        <p className="text-dim-grey mb-6">Your bucket list is waiting — create an account to get started.</p>
        <button
          onClick={openAuthModal}
          className="bg-indigo-brand text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Sign in / Sign up
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your list is empty</h2>
        <p className="text-dim-grey mb-6">Browse ideas and add the ones that inspire you.</p>
        <Link
          to="/"
          className="inline-block bg-indigo-brand text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Browse Ideas
        </Link>
      </div>
    )
  }

  const completedCount = items.filter(i => i.is_completed).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bucket List</h1>
        <span className="text-sm text-dim-grey">
          {completedCount} / {items.length} done
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition-opacity ${
              item.is_completed ? 'border-gray-100 opacity-60' : 'border-gray-200'
            }`}
          >
            {/* Complete toggle */}
            <button
              onClick={() => toggleCompleted(item)}
              aria-label={item.is_completed ? 'Mark incomplete' : 'Mark complete'}
              className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                item.is_completed
                  ? 'bg-indigo-brand border-indigo-brand text-white'
                  : 'border-gray-300 hover:border-indigo-brand'
              }`}
            >
              {item.is_completed && <CheckIcon className="w-3.5 h-3.5 stroke-2" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium leading-snug ${
                item.is_completed ? 'line-through text-dim-grey' : 'text-gray-900'
              }`}>
                {item.ideas?.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-dim-grey">
                {item.ideas?.categories?.name && (
                  <span>{item.ideas.categories.name}</span>
                )}
                {item.ideas?.country && item.ideas.country !== 'anywhere' && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <GlobeAltIcon className="w-3 h-3" />
                      {item.ideas.country}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Reorder + remove controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1.5 text-dim-grey hover:text-gray-900 disabled:opacity-25 transition-colors"
              >
                <ChevronUpIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="p-1.5 text-dim-grey hover:text-gray-900 disabled:opacity-25 transition-colors"
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeItem(item)}
                aria-label="Remove from list"
                className="p-1.5 text-dim-grey hover:text-red-500 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
