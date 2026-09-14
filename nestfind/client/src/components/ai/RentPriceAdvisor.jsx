// nestfind/nestfind/client/src/components/ai/RentPriceAdvisor.jsx

import { useState } from 'react'
import { Bot, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { useAI } from '../../hooks/useAI'
import { formatCurrency } from '../../utils/formatters'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Input from '../ui/Input'
import {
  PROPERTY_TYPES,
  SUB_CITIES,
  FURNISHED_OPTIONS
} from '../../utils/constants'
import ProgressBar from '../ui/ProgressBar'

const RentPriceAdvisor = ({
  propertyDetails: initialDetails = null,
  onPriceSelect
}) => {
  const [form, setForm] = useState({
    propertyType: initialDetails?.propertyType || '',
    subCity: initialDetails?.subCity || '',
    bedrooms: initialDetails?.bedrooms || '',
    bathrooms: initialDetails?.bathrooms || '',
    area: initialDetails?.area || '',
    furnished: initialDetails?.furnished || '',
    currentRent: ''
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { getRentAdvice } = useAI()

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAnalyze = async () => {
    if (!form.propertyType || !form.subCity) {
      return
    }
    setLoading(true)
    const advice = await getRentAdvice({
      ...form,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 1,
      area: Number(form.area) || 0,
      currentRent: form.currentRent ? Number(form.currentRent) : null
    })
    if (advice.success) setResult(advice)
    setLoading(false)
  }

  const getTrendIcon = trend => {
    if (trend === 'overpriced')
      return <TrendingDown size={14} className='text-red-400' />
    if (trend === 'underpriced')
      return <TrendingUp size={14} className='text-green-400' />
    return <Minus size={14} className='text-yellow-400' />
  }

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center'>
          <Bot size={18} className='text-yellow-400' />
        </div>
        <div>
          <h3 className='text-base font-bold text-white font-display'>
            AI Rent Advisor
          </h3>
          <p className='text-xs text-gray-400'>
            Get data-driven rent recommendations
          </p>
        </div>
      </div>

      {/* Form */}
      <div className='grid grid-cols-2 gap-3'>
        <Select
          label='Property Type *'
          value={form.propertyType}
          onChange={e => handleChange('propertyType', e.target.value)}
          options={PROPERTY_TYPES}
          placeholder='Select type'
          required
        />
        <Select
          label='Sub-City *'
          value={form.subCity}
          onChange={e => handleChange('subCity', e.target.value)}
          options={SUB_CITIES.map(s => ({ value: s, label: s }))}
          placeholder='Select area'
          required
        />
        <Input
          label='Bedrooms'
          type='number'
          min='0'
          value={form.bedrooms}
          onChange={e => handleChange('bedrooms', e.target.value)}
          placeholder='0'
        />
        <Input
          label='Area (sqm)'
          type='number'
          min='0'
          value={form.area}
          onChange={e => handleChange('area', e.target.value)}
          placeholder='0'
        />
        <Select
          label='Furnished'
          value={form.furnished}
          onChange={e => handleChange('furnished', e.target.value)}
          options={FURNISHED_OPTIONS}
          placeholder='Select'
        />
        <Input
          label='Current Rent (ETB)'
          type='number'
          min='0'
          value={form.currentRent}
          onChange={e => handleChange('currentRent', e.target.value)}
          placeholder='Optional'
        />
      </div>

      <Button
        variant='gold'
        fullWidth
        loading={loading}
        icon={Bot}
        onClick={handleAnalyze}
        disabled={!form.propertyType || !form.subCity}
      >
        Analyze Rent Price
      </Button>

      {/* Results */}
      {result && (
        <div className='space-y-4 animate-fade-in'>
          {/* Recommended Price */}
          <div className='bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 text-center'>
            <p className='text-xs text-gray-400 mb-1'>
              Recommended Monthly Rent
            </p>
            <p className='text-3xl font-bold font-display'>
              <span className='text-yellow-400'>
                {formatCurrency(result.recommendedRent)}
              </span>
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              Range: {formatCurrency(result.priceRange?.min)} –{' '}
              {formatCurrency(result.priceRange?.max)}
            </p>

            {form.currentRent && result.pricingStatus && (
              <div className='flex items-center justify-center gap-1.5 mt-3 text-sm'>
                {getTrendIcon(result.pricingStatus)}
                <span
                  className={`font-medium ${
                    result.pricingStatus === 'overpriced'
                      ? 'text-red-400'
                      : result.pricingStatus === 'underpriced'
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {result.pricingStatus === 'overpriced'
                    ? `${result.pricingDifference}% above market`
                    : result.pricingStatus === 'underpriced'
                    ? `${Math.abs(result.pricingDifference)}% below market`
                    : 'Fair market price'}
                </span>
              </div>
            )}
          </div>

          {/* Market Factors */}
          {result.marketFactors?.length > 0 && (
            <div>
              <p className='text-sm font-semibold text-white mb-2'>
                Market Factors
              </p>
              <div className='space-y-2'>
                {result.marketFactors.map((factor, i) => (
                  <div key={i} className='flex items-start gap-2'>
                    <AlertCircle
                      size={12}
                      className='text-yellow-400 flex-shrink-0 mt-0.5'
                    />
                    <p className='text-xs text-gray-300'>{factor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence */}
          {result.confidence && (
            <div>
              <div className='flex justify-between items-center mb-1.5'>
                <span className='text-xs text-gray-400'>AI Confidence</span>
                <span className='text-xs font-semibold text-white'>
                  {result.confidence}%
                </span>
              </div>
              <ProgressBar value={result.confidence} max={100} height={6} />
            </div>
          )}

          {/* Use This Price */}
          {onPriceSelect && (
            <Button
              variant='outline'
              fullWidth
              onClick={() => onPriceSelect(result.recommendedRent)}
            >
              Use Recommended Price
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default RentPriceAdvisor
