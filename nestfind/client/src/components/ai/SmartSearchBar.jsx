// nestfind/nestfind/client/src/components/ai/SmartSearchBar.jsx

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mic, X, Sparkles, TrendingUp } from 'lucide-react'
import { useAIStore } from '../../context/AIContext'
import { useVoice } from '../../hooks/useVoice'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import aiApi from '../../api/aiApi'

const POPULAR_SEARCHES = [
  '2 bedroom in Bole under 30k',
  'Furnished studio near CMC',
  'Villa with parking in Yeka',
  'Apartment with generator Kirkos',
  '3 bedroom family home Nifas Silk'
]

const SmartSearchBar = ({
  placeholder = 'Search with AI — try "2 bedroom furnished in Bole under 25,000 ETB"',
  onSearch,
  className = '',
  autoFocus = false,
  defaultValue = ''
}) => {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { performSmartSearch } = useAIStore()

  const { isListening, toggleListening, isSupported, transcript } = useVoice({
    onResult: text => {
      setQuery(text)
      handleSearch(text)
    }
  })

  useEffect(() => {
    if (transcript) setQuery(transcript)
  }, [transcript])

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useDebouncedCallback(async q => {
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    setLoadingSuggestions(true)
    try {
      const response = await aiApi.getSearchSuggestions({ q })
      setSuggestions(response.data.data.suggestions || [])
    } catch {
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }, 400)

  const handleInputChange = e => {
    const val = e.target.value
    setQuery(val)
    setShowDropdown(true)
    fetchSuggestions(val)
  }

  const handleSearch = useCallback(
    searchQuery => {
      const q = searchQuery || query
      if (!q.trim()) return
      setShowDropdown(false)
      if (onSearch) {
        onSearch(q)
      } else {
        navigate(`/search?q=${encodeURIComponent(q.trim())}`)
      }
    },
    [query, onSearch, navigate]
  )

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') setShowDropdown(false)
  }

  const selectSuggestion = suggestion => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div
        className={`
        flex items-center gap-2 bg-surface-card border rounded-2xl px-4 py-3
        transition-all duration-200
        ${
          showDropdown
            ? 'border-yellow-500/50 shadow-gold'
            : 'border-surface-border hover:border-yellow-500/30'
        }
      `}
      >
        <Sparkles size={16} className='text-yellow-500 flex-shrink-0' />

        <input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className='flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none'
        />

        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className='text-gray-500 hover:text-white transition-colors'
          >
            <X size={14} />
          </button>
        )}

        {isSupported && (
          <button
            type='button'
            onClick={toggleListening}
            className={`p-1.5 rounded-lg transition-colors ${
              isListening
                ? 'text-red-400 bg-red-500/10'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Mic size={14} />
          </button>
        )}

        <button
          onClick={() => handleSearch()}
          className='px-4 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-xs rounded-xl hover:shadow-gold transition-all'
        >
          Search
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className='absolute top-full left-0 right-0 mt-2 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 overflow-hidden'
          >
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className='py-2'>
                <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-1'>
                  Suggestions
                </p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className='flex items-center gap-3 w-full px-4 py-2.5 hover:bg-surface-light transition-colors text-left'
                  >
                    <Search size={13} className='text-gray-500 flex-shrink-0' />
                    <span className='text-sm text-gray-300'>{s}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {query.length < 3 && (
              <div className='py-2 border-t border-surface-border'>
                <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-1 flex items-center gap-1.5'>
                  <TrendingUp size={10} />
                  Popular Searches
                </p>
                {POPULAR_SEARCHES.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(search)}
                    className='flex items-center gap-3 w-full px-4 py-2.5 hover:bg-surface-light transition-colors text-left'
                  >
                    <TrendingUp
                      size={13}
                      className='text-yellow-500/50 flex-shrink-0'
                    />
                    <span className='text-sm text-gray-400'>{search}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SmartSearchBar
