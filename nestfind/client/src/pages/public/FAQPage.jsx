import { useState, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import GradientText from '../../components/ui/GradientText'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import api from '../../api/axios'

const FAQItem = ({ faq }) => {
  const [open, setOpen] = useState(false)
  const [voted, setVoted] = useState(null)

  const handleVote = async isHelpful => {
    if (voted !== null) return
    setVoted(isHelpful)
    try {
      await api.patch(`/faq/${faq._id}/vote`, { isHelpful })
    } catch {}
  }

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all ${
        open ? 'border-yellow-500/30' : 'border-surface-border'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center justify-between w-full p-5 text-left hover:bg-surface-light transition-colors'
      >
        <span className='text-sm font-semibold text-white pr-4'>
          {faq.question}
        </span>
        {open ? (
          <ChevronUp size={16} className='text-yellow-400 flex-shrink-0' />
        ) : (
          <ChevronDown size={16} className='text-gray-400 flex-shrink-0' />
        )}
      </button>

      {open && (
        <div className='px-5 pb-5 border-t border-surface-border'>
          <p className='text-sm text-gray-300 leading-relaxed mt-4 mb-4'>
            {faq.answer}
          </p>
          <div className='flex items-center gap-3'>
            <span className='text-xs text-gray-500'>Was this helpful?</span>
            <button
              onClick={() => handleVote(true)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                voted === true
                  ? 'text-green-400'
                  : 'text-gray-500 hover:text-green-400'
              }`}
            >
              <ThumbsUp size={12} /> Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                voted === false
                  ? 'text-red-400'
                  : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <ThumbsDown size={12} /> No
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const FAQPage = () => {
  const [faqs, setFaqs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtered, setFiltered] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faqRes, catRes] = await Promise.all([
          api.get('/faq'),
          api.get('/faq/categories')
        ])
        setFaqs(faqRes.data.data.faqs || [])
        setFiltered(faqRes.data.data.faqs || [])
        setCategories(catRes.data.data.categories || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    let result = [...faqs]
    if (selectedCategory)
      result = result.filter(f => f.category === selectedCategory)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        f =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [faqs, selectedCategory, searchQuery])

  if (loading)
    return (
      <PublicLayout>
        <PageLoader />
      </PublicLayout>
    )

  return (
    <PublicLayout>
      <SEO
        title='FAQ'
        description="Frequently asked questions about NestFind — Ethiopia's rental platform."
      />

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <ScrollReveal animation='fadeUp'>
          <div className='text-center mb-10'>
            <span className='text-xs font-semibold text-yellow-400 uppercase tracking-wider'>
              FAQ
            </span>
            <h1 className='text-3xl sm:text-4xl font-bold font-display text-white mt-2 mb-3'>
              Frequently Asked <GradientText>Questions</GradientText>
            </h1>
            <p className='text-gray-400'>
              Everything you need to know about NestFind
            </p>
          </div>
        </ScrollReveal>

        {/* Search */}
        <div className='relative mb-6'>
          <Search
            size={16}
            className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'
          />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search questions...'
            className='w-full bg-surface-card border border-surface-border text-white placeholder-gray-500 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-yellow-500 transition-colors'
          />
        </div>

        {/* Category Filters */}
        <div className='flex flex-wrap gap-2 mb-6'>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              !selectedCategory
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            All
          </button>
          {categories.map(({ category, count }) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category ? '' : category
                )
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                selectedCategory === category
                  ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                  : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
              }`}
            >
              {category.replace(/_/g, ' ')} ({count})
            </button>
          ))}
        </div>

        {/* FAQ List */}
        {filtered.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400'>
              No FAQs found. Try a different search.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filtered.map(faq => (
              <ScrollReveal key={faq._id} animation='fadeUp'>
                <FAQItem faq={faq} />
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className='mt-10 text-center p-6 bg-surface-card border border-surface-border rounded-2xl'>
          <p className='text-sm font-semibold text-white mb-1'>
            Still have questions?
          </p>
          <p className='text-xs text-gray-400 mb-4'>
            Our support team is here to help
          </p>

          <a
            href='/contact'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl hover:shadow-gold transition-all'
          >
            Contact Support
          </a>
        </div>
      </div>
    </PublicLayout>
  )
}

export default FAQPage
