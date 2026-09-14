// nestfind/nestfind/client/src/components/ai/VoiceOutput.jsx

import { Volume2, VolumeX, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { useVoice } from '../../hooks/useVoice'

const VoiceOutput = ({
  text,
  language = 'en-US',
  rate = 1.0,
  autoPlay = false,
  className = '',
  size = 'sm'
}) => {
  const { speak, stopSpeaking, isSpeaking, isSupported } = useVoice({
    language
  })

  const handleToggle = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else if (text) {
      speak(text, { language, rate })
    }
  }

  if (!isSupported) return null

  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-8 h-8'
  }

  return (
    <motion.button
      type='button'
      onClick={handleToggle}
      whileTap={{ scale: 0.95 }}
      disabled={!text}
      className={`
        ${
          sizes[size]
        } rounded-lg flex items-center justify-center transition-all
        ${
          isSpeaking
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10'
        }
        disabled:opacity-30 disabled:cursor-not-allowed
        ${className}
      `}
      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
    >
      {isSpeaking ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Square size={12} />
        </motion.div>
      ) : (
        <Volume2 size={12} />
      )}
    </motion.button>
  )
}

export default VoiceOutput
