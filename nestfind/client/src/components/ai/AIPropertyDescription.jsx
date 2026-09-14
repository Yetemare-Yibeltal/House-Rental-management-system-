// nestfind/nestfind/client/src/components/ai/AIPropertyDescription.jsx

import { useState } from 'react'
import { Bot, Copy, RefreshCw, Check, Languages } from 'lucide-react'
import aiApi from '../../api/aiApi'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { copyToClipboard } from '../../utils/helpers'
import toast from 'react-hot-toast'

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm & Friendly' },
  { value: 'luxury', label: 'Luxury Premium' },
  { value: 'simple', label: 'Simple & Clear' }
]

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (80-120 words)' },
  { value: 'medium', label: 'Medium (150-220 words)' },
  { value: 'long', label: 'Long (250-350 words)' }
]

const AIPropertyDescription = ({ propertyDetails, onApply }) => {
  const [generated, setGenerated] = useState('')
  const [amharic, setAmharic] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const handleGenerate = async () => {
    if (!propertyDetails?.propertyType) {
      toast.error('Please fill in property details first')
      return
    }
    setLoading(true)
    try {
      const response = await aiApi.generateDescription({
        propertyDetails,
        tone,
        length,
        language: 'en'
      })
      const { description, wordCount: wc } = response.data.data
      setGenerated(description)
      setWordCount(wc)
      setAmharic('')
      toast.success('Description generated!')
    } catch {
      toast.error('Failed to generate description')
    } finally {
      setLoading(false)
    }
  }

  const handleTranslate = async () => {
    if (!generated) return
    setTranslating(true)
    try {
      const response = await aiApi.translateDescription({
        description: generated
      })
      setAmharic(response.data.data.amharic)
      toast.success('Translated to Amharic!')
    } catch {
      toast.error('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const handleCopy = async text => {
    await copyToClipboard(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImprove = async () => {
    if (!generated) return
    setLoading(true)
    try {
      const response = await aiApi.improveDescription({
        existingDescription: generated,
        propertyDetails
      })
      setGenerated(response.data.data.improved)
      toast.success('Description improved!')
    } catch {
      toast.error('Failed to improve description')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center'>
          <Bot size={18} className='text-yellow-400' />
        </div>
        <div>
          <p className='text-sm font-bold text-white'>
            AI Description Generator
          </p>
          <p className='text-xs text-gray-400'>
            Create compelling property descriptions instantly
          </p>
        </div>
      </div>

      {/* Options */}
      <div className='grid grid-cols-2 gap-3'>
        <Select
          label='Tone'
          value={tone}
          onChange={e => setTone(e.target.value)}
          options={TONE_OPTIONS}
          size='sm'
        />
        <Select
          label='Length'
          value={length}
          onChange={e => setLength(e.target.value)}
          options={LENGTH_OPTIONS}
          size='sm'
        />
      </div>

      <Button
        variant='gold'
        fullWidth
        loading={loading}
        icon={Bot}
        onClick={handleGenerate}
      >
        Generate Description
      </Button>

      {/* Generated Description */}
      {generated && (
        <div className='space-y-3 animate-fade-in'>
          <div className='relative'>
            <div className='bg-surface-light border border-surface-border rounded-xl p-4'>
              <p className='text-sm text-gray-200 leading-relaxed whitespace-pre-wrap'>
                {generated}
              </p>
            </div>
            <div className='flex items-center justify-between mt-2 px-1'>
              <span className='text-xs text-gray-500'>{wordCount} words</span>
              <div className='flex gap-2'>
                <button
                  onClick={() => handleCopy(generated)}
                  className='flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                >
                  {copied ? (
                    <Check size={12} className='text-green-400' />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleImprove}
                  className='flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                >
                  <RefreshCw size={12} />
                  Improve
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            {onApply && (
              <Button
                variant='gold'
                size='sm'
                fullWidth
                onClick={() => {
                  onApply(generated)
                  toast.success('Description applied!')
                }}
              >
                Use This Description
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              fullWidth
              icon={Languages}
              loading={translating}
              onClick={handleTranslate}
            >
              Translate to Amharic
            </Button>
          </div>

          {/* Amharic Translation */}
          {amharic && (
            <div className='animate-fade-in'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-xs font-semibold text-yellow-400'>
                  Amharic Translation
                </p>
                <button
                  onClick={() => handleCopy(amharic)}
                  className='flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
              <div className='bg-surface-light border border-surface-border rounded-xl p-4'>
                <p className='text-sm text-gray-200 leading-relaxed'>
                  {amharic}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AIPropertyDescription
