// nestfind/nestfind/client/src/components/ai/AIChatAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic, MicOff, ThumbsUp, ThumbsDown, RefreshCw, Minimize2 } from 'lucide-react';
import { useAIStore } from '../../context/AIContext';
import { useAuthStore } from '../../context/AuthContext';
import { useVoice } from '../../hooks/useVoice';
import Avatar from '../ui/Avatar';
import { formatTimeAgo } from '../../utils/formatters';

const MessageBubble = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState(null);

  const handleFeedback = (isHelpful) => {
    setFeedbackGiven(isHelpful);
    onFeedback?.(message.id, isHelpful);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot size={14} className="text-black" />
        </div>
      )}

      <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-yellow-600 to-yellow-500 text-black rounded-br-sm font-medium'
              : message.isError
              ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
              : 'bg-surface-card border border-surface-border text-gray-200 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Suggested Replies */}
        {!isUser && message.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.suggestions.map((suggestion, i) => (
              <button
                key={i}
                className="px-2.5 py-1 text-xs rounded-full border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Feedback */}
        {!isUser && !message.isError && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-gray-500">{formatTimeAgo(message.timestamp)}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFeedback(true)}
                className={`p-1 rounded transition-colors ${feedbackGiven === true ? 'text-green-400' : 'text-gray-600 hover:text-green-400'}`}
              >
                <ThumbsUp size={10} />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className={`p-1 rounded transition-colors ${feedbackGiven === false ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
              >
                <ThumbsDown size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-2">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center flex-shrink-0">
      <Bot size={14} className="text-black" />
    </div>
    <div className="bg-surface-card border border-surface-border px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  </div>
);

const AIChatAssistant = () => {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const {
    isChatOpen, messages, isTyping, isLoading,
    openChat, closeChat, sendMessage, clearChat, addFeedback,
  } = useAIStore();
  const { user } = useAuthStore();
  const {
    isListening, transcript, toggleListening, clearTranscript, isSupported,
  } = useVoice({
    onResult: (text) => setInput((prev) => prev + text),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isTyping) return;
    setInput('');
    clearTranscript();
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => openChat()}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center z-40 shadow-gold hover:shadow-gold-lg transition-all animate-pulse-gold"
          >
            <Bot size={24} className="text-black" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`
              fixed bottom-6 right-6 z-50
              bg-dark border border-surface-border rounded-2xl shadow-2xl
              flex flex-col overflow-hidden
              ${isMinimized ? 'w-72 h-14' : 'w-80 sm:w-96 h-[520px]'}
              transition-all duration-300
            `}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-card border-b border-surface-border flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
                <Bot size={16} className="text-black" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">NestFind AI</p>
                {!isMinimized && (
                  <p className="text-[10px] text-green-400">Online · Ready to help</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                  title="New conversation"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Minimize2 size={13} />
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <Bot size={28} className="text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Hi{user ? `, ${user.firstName}` : ''}! 👋</p>
                        <p className="text-xs text-gray-400 mt-1">
                          I'm your NestFind AI assistant. Ask me anything about properties, rentals, or contracts.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['Find me a 2BR in Bole', 'Explain my lease', 'What\'s a fair rent?'].map((q) => (
                          <button
                            key={q}
                            onClick={() => { setInput(q); inputRef.current?.focus(); }}
                            className="text-xs px-2.5 py-1 rounded-full border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        onFeedback={addFeedback}
                      />
                    ))
                  )}

                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 px-3 py-3 border-t border-surface-border bg-surface-card">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-dark border border-surface-border rounded-xl px-3 py-2 flex items-end gap-2">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about properties, rent, contracts..."
                        rows={1}
                        maxLength={500}
                        className="flex-1 bg-transparent text-white text-xs placeholder-gray-500 outline-none resize-none max-h-20 leading-relaxed"
                      />
                    </div>

                    {isSupported && (
                      <button
                        onClick={toggleListening}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-surface-border text-gray-400 hover:text-yellow-400'
                        }`}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    )}

                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="w-8 h-8 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 flex items-center justify-center text-black hover:shadow-gold transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;