// nestfind/nestfind/client/src/components/public/HeroSection.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Mic, Bot, Building2, Home, Star } from 'lucide-react'
import GradientText from '../ui/GradientText'
import ScrollReveal from '../ui/ScrollReveal'

const HeroSection = () => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = e => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    else navigate('/listings')
  }

  const quickSearches = [
    '2 bedroom in Bole under 25k',
    'Furnished studio near CMC',
    'Villa with pool in Yeka',
    'Apartment with generator Kirkos'
  ]

  const stats = [
    { value: '5,000+', label: 'Verified Listings', icon: Building2 },
    { value: '2,000+', label: 'Happy Tenants', icon: Home },
    { value: '4.8★', label: 'Average Rating', icon: Star },
    { value: '24h', label: 'Support', icon: Bot }
  ]

  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-dark via-surface-card to-dark' />
      <div
        className='absolute inset-0 opacity-5'
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,168,76,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />
      <div className='absolute top-1/4 left-1/6 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl' />
      <div className='absolute bottom-1/4 right-1/6 w-80 h-80 bg-yellow-600/6 rounded-full blur-3xl' />

      <div className='relative z-10 max-w-4xl mx-auto px-4 text-center'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm font-medium mb-6'
        >
          <Bot size={14} />
          AI-Powered Rental Platform for Ethiopia
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className='text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 text-white'
        >
          Find Your Perfect Home in <GradientText>Addis Ababa</GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className='text-gray-400 text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed'
        >
          Search thousands of verified rental properties using natural language.
          Just describe what you need and our AI will find it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className='mb-4'
        >
          <form
            onSubmit={handleSearch}
            className='flex items-center gap-2 bg-surface-card border border-surface-border rounded-2xl p-2 shadow-2xl hover:border-yellow-500/30 transition-colors'
          >
            <div className='flex items-center gap-2 flex-1 px-2'>
              <Search size={18} className='text-gray-400 flex-shrink-0' />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='e.g. 2 bedroom furnished apartment in Bole under 30,000 ETB...'
                className='flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none'
              />
            </div>
            <button
              type='submit'
              className='px-5 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl hover:shadow-gold transition-all'
            >
              Search
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className='flex flex-wrap gap-2 justify-center mb-12'
        >
          <span className='text-xs text-gray-500'>Try:</span>
          {quickSearches.map(search => (
            <button
              key={search}
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(search)}`)
              }
              className='text-xs text-gray-400 hover:text-yellow-400 px-3 py-1 rounded-full border border-surface-border hover:border-yellow-500/30 transition-all'
            >
              {search}
            </button>
          ))}
        </motion.div>

        <ScrollReveal animation='fadeUp' delay={0.2}>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {stats.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className='bg-surface-card/60 border border-surface-border rounded-xl p-4 backdrop-blur-sm'
              >
                <div className='flex items-center justify-center mb-2'>
                  <Icon size={18} className='text-yellow-500/60' />
                </div>
                <p className='text-xl font-bold font-display'>
                  <GradientText>{value}</GradientText>
                </p>
                <p className='text-xs text-gray-400 mt-0.5'>{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default HeroSection
