// nestfind/nestfind/client/src/components/ai/LeaseExplainer.jsx

import { useState } from 'react'
import {
  Bot,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Volume2
} from 'lucide-react'
import { useAI } from '../../hooks/useAI'
import { useVoice } from '../../hooks/useVoice'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

const Section = ({ title, children, icon: Icon, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className='border border-surface-border rounded-xl overflow-hidden'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center justify-between w-full px-4 py-3 bg-surface-light hover:bg-surface-card transition-colors'
      >
        <div className='flex items-center gap-2'>
          {Icon && <Icon size={14} className='text-yellow-400' />}
          <span className='text-sm font-semibold text-white'>{title}</span>
        </div>
        {open ? (
          <ChevronUp size={14} className='text-gray-400' />
        ) : (
          <ChevronDown size={14} className='text-gray-400' />
        )}
      </button>
      {open && (
        <div className='px-4 py-3 bg-surface-card space-y-2'>{children}</div>
      )}
    </div>
  )
}

const LeaseExplainer = ({ contractId, language = 'en' }) => {
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { explainLease } = useAI()
  const { speak, isSpeaking, stopSpeaking } = useVoice()

  const handleExplain = async () => {
    setLoading(true)
    setError(null)
    const result = await explainLease(contractId, language)
    if (result.success) {
      setExplanation(result)
    } else {
      setError(result.error || 'Failed to explain lease')
    }
    setLoading(false)
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center'>
            <Bot size={16} className='text-yellow-400' />
          </div>
          <div>
            <p className='text-sm font-bold text-white'>AI Lease Explainer</p>
            <p className='text-xs text-gray-400'>
              Understand your contract in plain language
            </p>
          </div>
        </div>
        {explanation?.summary && (
          <button
            onClick={() =>
              isSpeaking ? stopSpeaking() : speak(explanation.summary)
            }
            className='flex items-center gap-1.5 text-xs text-gray-400 hover:text-yellow-400 transition-colors'
          >
            <Volume2 size={12} />
            {isSpeaking ? 'Stop' : 'Listen'}
          </button>
        )}
      </div>

      {!explanation && !loading && (
        <Button variant='gold' fullWidth icon={Bot} onClick={handleExplain}>
          Explain My Lease
        </Button>
      )}

      {loading && (
        <div className='flex flex-col items-center justify-center py-8 gap-3'>
          <LoadingSpinner size='lg' />
          <p className='text-sm text-gray-400'>
            Reading and analyzing your contract...
          </p>
        </div>
      )}

      {error && (
        <div className='flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl'>
          <AlertTriangle size={14} className='text-red-400' />
          <p className='text-sm text-red-300'>{error}</p>
        </div>
      )}

      {explanation && (
        <div className='space-y-3'>
          {/* Summary */}
          <div className='p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl'>
            <p className='text-xs font-semibold text-yellow-400 mb-2'>
              📋 Summary
            </p>
            <p className='text-sm text-gray-200 leading-relaxed'>
              {explanation.summary}
            </p>
          </div>

          {/* Overall Assessment */}
          {explanation.overallAssessment && (
            <div className='flex items-start gap-2 p-3 bg-surface-card border border-surface-border rounded-xl'>
              <CheckCircle
                size={14}
                className='text-green-400 flex-shrink-0 mt-0.5'
              />
              <p className='text-sm text-gray-300'>
                {explanation.overallAssessment}
              </p>
            </div>
          )}

          {/* Key Obligations */}
          {explanation.keyObligations && (
            <Section
              title='Your Obligations as Tenant'
              icon={CheckCircle}
              defaultOpen
            >
              <ul className='space-y-1.5'>
                {(explanation.keyObligations.tenant || []).map((item, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-2 text-sm text-gray-300'
                  >
                    <span className='text-yellow-400 mt-0.5 flex-shrink-0'>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Risky Clauses */}
          {explanation.riskyClause?.length > 0 && (
            <Section title='⚠️ Risky Clauses to Watch' icon={AlertTriangle}>
              <div className='space-y-2'>
                {explanation.riskyClause.map((risk, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      risk.severity === 'high'
                        ? 'bg-red-500/5 border-red-500/20'
                        : risk.severity === 'medium'
                        ? 'bg-orange-500/5 border-orange-500/20'
                        : 'bg-yellow-500/5 border-yellow-500/20'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold mb-1 ${
                        risk.severity === 'high'
                          ? 'text-red-400'
                          : risk.severity === 'medium'
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {risk.clause}
                    </p>
                    <p className='text-xs text-gray-400'>{risk.risk}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Tenant Rights */}
          {explanation.tenantRights?.length > 0 && (
            <Section title='Your Rights as Tenant'>
              <ul className='space-y-1.5'>
                {explanation.tenantRights.map((right, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-2 text-sm text-gray-300'
                  >
                    <CheckCircle
                      size={12}
                      className='text-green-400 flex-shrink-0 mt-0.5'
                    />
                    {right}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Button
            variant='outline'
            size='sm'
            fullWidth
            onClick={handleExplain}
            icon={Bot}
          >
            Regenerate Explanation
          </Button>
        </div>
      )}
    </div>
  )
}

export default LeaseExplainer
