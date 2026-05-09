import { Link } from 'react-router-dom'
import {
  GlobeAltIcon,
  QueueListIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'

const FEATURES = [
  {
    Icon: GlobeAltIcon,
    title: 'Discover Ideas',
    body: 'Browse hundreds of experiences across every category and destination, submitted by people just like you.',
  },
  {
    Icon: QueueListIcon,
    title: 'Build Your List',
    body: 'Add ideas to your personal bucket list, mark them complete, and keep things in the order that matters to you.',
  },
  {
    Icon: ChatBubbleLeftRightIcon,
    title: 'Join the Forum',
    body: 'Share tips, stories, and advice with others who have done what you dream of doing.',
  },
]

export default function HomePage() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  return (
    <div>
      {/* Hero */}
      <section className="bg-indigo-brand text-white px-6 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
          The world is your{' '}
          <span className="text-canary">bucket list.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/75 max-w-xl mx-auto mb-10">
          Discover experiences, build your personal list, and connect with others who share your passions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <>
              <Link
                to="/browse"
                className="bg-canary text-indigo-brand font-bold px-7 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Browse ideas
              </Link>
              <Link
                to="/my-list"
                className="border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                My list &rarr;
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={openAuthModal}
                className="bg-canary text-indigo-brand font-bold px-7 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Sign up free
              </button>
              <Link
                to="/browse"
                className="border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Browse ideas &rarr;
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 bg-lavender/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-indigo-brand" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-sm text-dim-grey leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-canary px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-brand mb-3">
            Ready to start your adventure?
          </h2>
          <p className="text-indigo-brand/70 mb-8">
            Join thousands of people building their bucket lists.
          </p>
          <button
            onClick={openAuthModal}
            className="bg-indigo-brand text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Create your free account &rarr;
          </button>
        </section>
      )}
    </div>
  )
}
