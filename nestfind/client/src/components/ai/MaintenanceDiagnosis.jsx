// nestfind/nestfind/client/src/components/ai/MaintenanceDiagnosis.jsx

import { useState } from 'react'
import {
  Bot,
  AlertTriangle,
  Wrench,
  CheckCircle,
  ChevronRight
} from 'lucide-react'
import { useAI } from '../../hooks/useAI'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'

const urgencyColors = {
  emergency: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'green'
}

const MaintenanceDiagnosis = ({ onDiagnosisComplete }) => {
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { diagnoseMaintenanceIssue } = useAI()

  const handleDiagnose = async () => {
    if (!description.trim() || description.length < 20) return
    setLoading(true)
    const diagnosis = await diagnoseMaintenanceIssue({ title, description })
    if (diagnosis.success) {
      setResult(diagnosis)
      onDiagnosisComplete?.(diagnosis)
    }
    setLoading(false)
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
            AI Maintenance Diagnosis
          </p>
          <p className='text-xs text-gray-400'>
            Describe your issue and get instant analysis
          </p>
        </div>
      </div>

      {!result && (
        <div className='space-y-3'>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='Brief title (e.g. Leaking pipe)'
            className='w-full bg-surface-card border border-surface-border text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500'
          />
          <Textarea
            placeholder='Describe the issue in detail — when did it start, where exactly, how severe...'
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            showCount
          />
          <Button
            variant='gold'
            fullWidth
            loading={loading}
            icon={Bot}
            onClick={handleDiagnose}
            disabled={description.length < 20}
          >
            Diagnose Issue
          </Button>
        </div>
      )}

      {loading && (
        <div className='flex flex-col items-center py-8 gap-3'>
          <LoadingSpinner size='lg' />
          <p className='text-sm text-gray-400'>
            Analyzing your maintenance issue...
          </p>
        </div>
      )}

      {result && !loading && (
        <div className='space-y-4 animate-fade-in'>
          {/* Urgency Banner */}
          <div
            className={`p-4 rounded-xl border ${
              result.urgency === 'emergency'
                ? 'bg-red-500/10 border-red-500/30'
                : result.urgency === 'high'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <p className='text-sm font-bold text-white'>Diagnosis Result</p>
              <Badge
                variant={urgencyColors[result.urgency] || 'gold'}
                size='sm'
                dot
              >
                {result.urgencyInfo?.label || result.urgency}
              </Badge>
            </div>
            <p className='text-sm text-gray-200 leading-relaxed'>
              {result.diagnosis}
            </p>
            {result.likelyCause && (
              <p className='text-xs text-gray-400 mt-2'>
                <strong className='text-gray-300'>Likely cause:</strong>{' '}
                {result.likelyCause}
              </p>
            )}
          </div>

          {/* Emergency Warning */}
          {result.isEmergency && (
            <div className='flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl'>
              <AlertTriangle size={16} className='text-red-400 flex-shrink-0' />
              <div>
                <p className='text-sm font-bold text-red-400'>
                  ⚠️ Emergency! Act Immediately
                </p>
                <p className='text-xs text-red-300 mt-0.5'>
                  {result.urgencyInfo?.description}
                </p>
              </div>
            </div>
          )}

          {/* Immediate Steps */}
          {result.immediateSteps?.length > 0 && (
            <div>
              <p className='text-sm font-semibold text-white mb-2'>
                Immediate Steps
              </p>
              <div className='space-y-1.5'>
                {result.immediateSteps.map((step, i) => (
                  <div key={i} className='flex items-start gap-2'>
                    <span className='w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5'>
                      {i + 1}
                    </span>
                    <p className='text-sm text-gray-300'>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DIY Fixes */}
          {result.diyFixSuggestions?.length > 0 && (
            <div>
              <p className='text-sm font-semibold text-white mb-2'>
                <span className='mr-1'>🔧</span>
                Simple DIY Fixes
              </p>
              <div className='space-y-1.5'>
                {result.diyFixSuggestions.map((fix, i) => (
                  <div key={i} className='flex items-start gap-2'>
                    <CheckCircle
                      size={12}
                      className='text-green-400 flex-shrink-0 mt-0.5'
                    />
                    <p className='text-sm text-gray-300'>{fix}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professional Required */}
          {result.requiresProfessional && (
            <div className='flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl'>
              <Wrench size={14} className='text-blue-400' />
              <p className='text-sm text-blue-300'>
                Professional repair recommended
              </p>
            </div>
          )}

          {/* Cost Estimate */}
          {result.estimatedCostRange && (
            <div className='flex items-center justify-between p-3 bg-surface-light rounded-xl'>
              <span className='text-xs text-gray-400'>
                Estimated Repair Cost
              </span>
              <span className='text-sm font-semibold text-white'>
                {result.estimatedCostRange}
              </span>
            </div>
          )}

          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              fullWidth
              onClick={() => {
                setResult(null)
                setDescription('')
                setTitle('')
              }}
            >
              New Diagnosis
            </Button>
            <Button
              variant='gold'
              size='sm'
              fullWidth
              icon={ChevronRight}
              iconPosition='right'
              onClick={() => onDiagnosisComplete?.(result)}
            >
              Submit Request
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceDiagnosis
