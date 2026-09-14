// nestfind/nestfind/client/src/components/ai/FraudWarning.jsx

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'

const FraudWarning = ({ fraudData }) => {
  if (!fraudData || fraudData.fraudScore === undefined) return null

  const {
    fraudScore,
    verdict,
    flags,
    keyRisks,
    action,
    priceConsistency,
    analysis
  } = fraudData

  const getScoreColor = score => {
    if (score >= 70) return 'red'
    if (score >= 40) return 'orange'
    if (score >= 20) return 'gold'
    return 'green'
  }

  const getVerdictConfig = v => {
    switch (v) {
      case 'legitimate':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bg: 'bg-green-500/10 border-green-500/20',
          label: 'Appears Legitimate'
        }
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10 border-orange-500/20',
          label: 'Suspicious Listing'
        }
      case 'likely_fraud':
      case 'definite_fraud':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
          label: 'Possible Fraud Detected'
        }
      default:
        return {
          icon: Info,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          label: 'Under Review'
        }
    }
  }

  const config = getVerdictConfig(verdict)
  const IconComponent = config.icon

  if (fraudScore < 20) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${config.bg}`}
    >
      {/* Header */}
      <div className='flex items-center gap-2 mb-3'>
        <IconComponent size={18} className={config.color} />
        <p className={`text-sm font-bold ${config.color}`}>
          AI Fraud Analysis — {config.label}
        </p>
        <div className='ml-auto flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1'>
          <Shield size={11} className={config.color} />
          <span className={`text-xs font-bold ${config.color}`}>
            Risk Score: {fraudScore}/100
          </span>
        </div>
      </div>

      {/* Score Bar */}
      <ProgressBar
        value={fraudScore}
        max={100}
        color={getScoreColor(fraudScore)}
        height={6}
        className='mb-3'
      />

      {/* Analysis */}
      {analysis && (
        <p className='text-xs text-gray-300 leading-relaxed mb-3'>{analysis}</p>
      )}

      {/* Key Risks */}
      {keyRisks?.length > 0 && (
        <div className='space-y-1.5 mb-3'>
          {keyRisks.map((risk, i) => (
            <div key={i} className='flex items-start gap-2'>
              <AlertTriangle
                size={11}
                className='text-orange-400 flex-shrink-0 mt-0.5'
              />
              <p className='text-xs text-gray-300'>{risk}</p>
            </div>
          ))}
        </div>
      )}

      {/* Flags */}
      {flags?.filter(f => f.severity === 'high').length > 0 && (
        <div className='mt-2 pt-2 border-t border-white/10'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase mb-1.5'>
            High Severity Flags
          </p>
          <div className='space-y-1'>
            {flags
              .filter(f => f.severity === 'high')
              .map((flag, i) => (
                <div key={i} className='flex items-start gap-1.5'>
                  <span className='text-red-400 text-xs flex-shrink-0'>●</span>
                  <p className='text-xs text-red-300'>{flag.flag}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Price Consistency */}
      {priceConsistency && priceConsistency !== 'fair' && (
        <div className='mt-2 flex items-center gap-1.5 text-xs'>
          <Info size={11} className='text-gray-400' />
          <span className='text-gray-400'>
            Price:{' '}
            <span
              className={`font-semibold ${
                priceConsistency === 'very_low'
                  ? 'text-red-400'
                  : 'text-orange-400'
              }`}
            >
              {priceConsistency.replace(/_/g, ' ')} for this area
            </span>
          </span>
        </div>
      )}

      {/* Warning */}
      {fraudScore >= 50 && (
        <div className='mt-3 p-2.5 bg-black/20 rounded-xl'>
          <p className='text-xs text-gray-300'>
            ⚠️ <strong>Proceed with caution.</strong> Always visit properties in
            person before making any payments. Never pay before signing a
            contract.
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default FraudWarning
