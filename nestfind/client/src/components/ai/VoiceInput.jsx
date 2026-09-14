// nestfind/nestfind/client/src/components/ai/VoiceInput.jsx

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';

const VoiceInput = ({
  onResult,
  onTranscriptChange,
  language = 'en-US',
  className = '',
  size = 'md',
  showTranscript = true,
}) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    toggleListening,
    clearTranscript,
  } = useVoice({
    language,
    onResult: (text) => {
      onResult?.(text);
      onTranscriptChange?.(text);
    },
  });

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className={`${sizes[size]} rounded-xl bg-surface-card border border-surface-border text-gray-600 flex items-center justify-center cursor-not-allowed ${className}`}
        title="Voice input not supported in this browser"
      >
        <MicOff size={16} />
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={toggleListening}
          whileTap={{ scale: 0.95 }}
          className={`
            ${sizes[size]} rounded-xl flex items-center justify-center transition-all
            ${isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-surface-card border border-surface-border text-gray-400 hover:text-yellow-400 hover:border-yellow-500/30'
            }
          `}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </motion.button>

        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-red-400 rounded-full"
                animate={{ height: ['8px', '20px', '8px'] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
            <span className="text-xs text-red-400 ml-1">Listening...</span>
          </motion.div>
        )}
      </div>

      {/* Transcript Display */}
      <AnimatePresence>
        {showTranscript && (transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2"
          >
            <p className="text-sm text-gray-200">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-500 italic"> {interimTranscript}</span>
              )}
            </p>
            <div className="flex justify-end mt-1">
              <button
                onClick={clearTranscript}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;