import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import IdeaCard from '../components/ui/IdeaCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function BrowseIdeas() {
  const { user } = useAuth()

  const [ideas, setIdeas] = useState([])
  const [categories, setCategories] = useState([])
  const [countries, setCountries] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [loading, setLoading] = useState(true)

  // User state — tracked here so IdeaCard actions are instant
  const [userBucketListId, setUserBucketListId] = useState(null)
  const [userListIds, setUserListIds] = useState(new Set())
  const [userSavedIds, setUserSavedIds] = useState(new Set())

  // Load filter options once
  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('id, name, slug').order('name'),
      supabase.from('ideas').select('country').eq('status', 'active').neq('country', 'anywhere'),
    ]).then(([{ data: cats }, { data: ctry }]) => {
      setCategories(cats ?? [])
      const unique = [...new Set((ctry ?? []).map(r => r.country))].sort()
      setCountries(unique)
    })
  }, [])

  // Load user's list + saves when auth state changes
  useEffect(() => {
    if (!user) {
      setUserBucketListId(null)
      setUserListIds(new Set())
      setUserSavedIds(new Set())
      return
    }

    async function loadUserState() {
      const [{ data: bl }, { data: saved }] = await Promise.all([
        supabase.from('bucket_lists').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('saved_ideas').select('idea_id').eq('user_id', user.id),
      ])

      setUserBucketListId(bl?.id ?? null)
      setUserSavedIds(new Set((saved ?? []).map(s => s.idea_id)))

      if (bl) {
        const { data: items } = await supabase
          .from('bucket_list_items')
          .select('idea_id')
          .eq('bucket_list_id', bl.id)
        setUserListIds(new Set((items ?? []).map(i => i.idea_id)))
      }
    }

    loadUserState()
  }, [user])

  // Fetch ideas when filters change
  useEffect(() => {
    setLoading(true)

    let query = supabase
      .from('ideas')
      .select('id, title, description, country, add_count, save_count, forum_count, category_id, categories(name, slug)')
      .eq('status', 'active')
      .order('add_count', { ascending: false })

    if (selectedCategory) query = query.eq('category_id', selectedCategory)
    if (selectedCountry) query = query.or(`country.eq.${selectedCountry},country.eq.anywhere`)

    query.then(({ data }) => {
      setIdeas(data ?? [])
      setLoading(false)
    })
  }, [selectedCategory, selectedCountry])

  async function toggleList(ideaId, currentlyInList) {
    if (!user) return

    if (currentlyInList) {
      await supabase
        .from('bucket_list_items')
        .delete()
        .eq('bucket_list_id', userBucketListId)
        .eq('idea_id', ideaId)
      setUserListIds(prev => { const n = new Set(prev); n.delete(ideaId); return n })
    } else {
      let blId = userBucketListId

      if (!blId) {
        const { data } = await supabase
          .from('bucket_lists')
          .insert({ user_id: user.id })
          .select('id')
          .single()
        blId = data.id
        setUserBucketListId(blId)
      }

      await supabase
        .from('bucket_list_items')
        .insert({ bucket_list_id: blId, idea_id: ideaId, display_order: userListIds.size })

      setUserListIds(prev => new Set([...prev, ideaId]))
    }
  }

  async function toggleSave(ideaId, currentlySaved) {
    if (!user) return

    if (currentlySaved) {
      await supabase.from('saved_ideas').delete().eq('user_id', user.id).eq('idea_id', ideaId)
      setUserSavedIds(prev => { const n = new Set(prev); n.delete(ideaId); return n })
    } else {
      await supabase.from('saved_ideas').insert({ user_id: user.id, idea_id: ideaId })
      setUserSavedIds(prev => new Set([...prev, ideaId]))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Browse Ideas</h1>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-indigo-brand text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-brand text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Country filter */}
      <div className="mb-6">
        <select
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-brand/40"
        >
          <option value="">All countries</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Ideas grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : ideas.length === 0 ? (
        <p className="text-center text-dim-grey py-16">
          No ideas found. Try a different filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isInList={userListIds.has(idea.id)}
              isSaved={userSavedIds.has(idea.id)}
              onToggleList={toggleList}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
