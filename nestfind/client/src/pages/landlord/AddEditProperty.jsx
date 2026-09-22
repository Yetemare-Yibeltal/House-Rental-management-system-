// nestfind/nestfind/client/src/pages/landlord/AddEditProperty.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PropertyFormStep1 from '../../components/landlord/PropertyFormStep1'
import PropertyFormStep2 from '../../components/landlord/PropertyFormStep2'
import PropertyFormStep3 from '../../components/landlord/PropertyFormStep3'
import PropertyFormStep4 from '../../components/landlord/PropertyFormStep4'
import PropertyFormStep5 from '../../components/landlord/PropertyFormStep5'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import aiApi from '../../api/aiApi'
import toast from 'react-hot-toast'

const STEPS = [
  'Basic Info',
  'Location',
  'Details',
  'Pricing & Amenities',
  'Photos & Lease'
]

const initialFormState = {
  propertyType: '',
  title: '',
  description: '',
  location: {
    subCity: '',
    address: '',
    city: 'Addis Ababa',
    region: 'Addis Ababa'
  },
  details: {
    bedrooms: '',
    bathrooms: '',
    area: '',
    furnished: '',
    floorNumber: '',
    totalFloors: '',
    parkingSpaces: '',
    yearBuilt: ''
  },
  pricing: {
    monthlyRent: '',
    securityDeposit: '',
    utilityBills: 'excluded',
    negotiable: false
  },
  amenities: {},
  leaseTerms: { minimumLease: '6', noticePeriod: '30', availableFrom: '' }
}

const AddEditProperty = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const fetchProperty = async () => {
        try {
          const response = await landlordApi.getProperty(id)
          const p = response.data.data
          setForm({
            propertyType: p.propertyType || '',
            title: p.title || '',
            description: p.description || '',
            location: {
              subCity: p.location?.subCity || '',
              address: p.location?.address || '',
              city: p.location?.city || 'Addis Ababa',
              region: p.location?.region || ''
            },
            details: {
              bedrooms: p.details?.bedrooms?.toString() || '',
              bathrooms: p.details?.bathrooms?.toString() || '',
              area: p.details?.area?.toString() || '',
              furnished: p.details?.furnished || '',
              floorNumber: p.details?.floorNumber?.toString() || '',
              totalFloors: p.details?.totalFloors?.toString() || '',
              parkingSpaces: p.details?.parkingSpaces?.toString() || '',
              yearBuilt: p.details?.yearBuilt?.toString() || ''
            },
            pricing: {
              monthlyRent: p.pricing?.monthlyRent?.toString() || '',
              securityDeposit: p.pricing?.securityDeposit?.toString() || '',
              utilityBills: p.pricing?.utilityBills || 'excluded',
              negotiable: p.pricing?.negotiable || false
            },
            amenities: p.amenities || {},
            leaseTerms: {
              minimumLease: p.leaseTerms?.minimumLease?.toString() || '6',
              noticePeriod: p.leaseTerms?.noticePeriodDays?.toString() || '30',
              availableFrom: p.leaseTerms?.availableFrom?.split('T')[0] || ''
            }
          })
        } catch {
          navigate('/landlord/properties')
        } finally {
          setFetchLoading(false)
        }
      }
      fetchProperty()
    }
  }, [id, isEdit, navigate])

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleToggleAmenity = key => {
    setForm(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
    }))
  }

  const handleImagesChange = files => {
    setImages(files)
    setImagePreviews(
      files.map(f => ({ preview: URL.createObjectURL(f), name: f.name }))
    )
  }

  const handleRemoveImage = index => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleGenerateDescription = async () => {
    if (!form.propertyType) {
      toast.error('Select property type first')
      return
    }
    setAiGenerating(true)
    try {
      const response = await aiApi.generateDescription({
        propertyDetails: {
          propertyType: form.propertyType,
          bedrooms: form.details.bedrooms,
          bathrooms: form.details.bathrooms,
          area: form.details.area,
          furnished: form.details.furnished,
          subCity: form.location.subCity,
          amenities: form.amenities
        },
        tone: 'professional',
        length: 'medium',
        language: 'en'
      })
      handleChange('description', response.data.data.description)
      toast.success('AI description generated!')
    } catch {
      toast.error('Failed to generate description')
    } finally {
      setAiGenerating(false)
    }
  }

  const validateStep = () => {
    const newErrors = {}
    if (step === 1) {
      if (!form.propertyType) newErrors.propertyType = 'Required'
      if (!form.title) newErrors.title = 'Required'
      if (!form.description) newErrors.description = 'Required'
    }
    if (step === 2) {
      if (!form.location.subCity) newErrors['location.subCity'] = 'Required'
      if (!form.location.address) newErrors['location.address'] = 'Required'
    }
    if (step === 3) {
      if (form.details.bedrooms === '')
        newErrors['details.bedrooms'] = 'Required'
      if (!form.details.bathrooms) newErrors['details.bathrooms'] = 'Required'
      if (!form.details.area) newErrors['details.area'] = 'Required'
      if (!form.details.furnished) newErrors['details.furnished'] = 'Required'
    }
    if (step === 4) {
      if (!form.pricing.monthlyRent)
        newErrors['pricing.monthlyRent'] = 'Required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 5))
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('propertyType', form.propertyType)
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('location', JSON.stringify(form.location))
      formData.append(
        'details',
        JSON.stringify({
          bedrooms: parseInt(form.details.bedrooms) || 0,
          bathrooms: parseInt(form.details.bathrooms) || 1,
          area: parseFloat(form.details.area) || 0,
          furnished: form.details.furnished,
          floorNumber: parseInt(form.details.floorNumber) || 0,
          totalFloors: parseInt(form.details.totalFloors) || 1,
          parkingSpaces: parseInt(form.details.parkingSpaces) || 0,
          yearBuilt: parseInt(form.details.yearBuilt) || null
        })
      )
      formData.append(
        'pricing',
        JSON.stringify({
          monthlyRent: parseFloat(form.pricing.monthlyRent),
          securityDeposit: parseFloat(form.pricing.securityDeposit) || 0,
          utilityBills: form.pricing.utilityBills,
          negotiable: form.pricing.negotiable
        })
      )
      formData.append('amenities', JSON.stringify(form.amenities))
      formData.append(
        'leaseTerms',
        JSON.stringify({
          minimumLease: parseInt(form.leaseTerms.minimumLease) || 6,
          noticePeriodDays: parseInt(form.leaseTerms.noticePeriod) || 30,
          availableFrom: form.leaseTerms.availableFrom || null
        })
      )
      images.forEach(img => formData.append('images', img))

      if (isEdit) {
        await landlordApi.updateProperty(id, formData)
        toast.success('Property updated successfully!')
        navigate('/landlord/properties')
      } else {
        await landlordApi.createProperty(formData)
        setSubmitted(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading)
    return (
      <DashboardLayout>
        <PageLoader text='Loading property...' />
      </DashboardLayout>
    )

  if (submitted) {
    return (
      <DashboardLayout>
        <div className='max-w-md mx-auto text-center py-16'>
          <div className='w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5'>
            <CheckCircle size={36} className='text-green-400' />
          </div>
          <h2 className='text-2xl font-bold text-white font-display mb-3'>
            Property Submitted!
          </h2>
          <p className='text-gray-400 text-sm mb-6'>
            Your property has been submitted for review. Our team will review it
            within 24 hours. You'll be notified once it goes live.
          </p>
          <div className='flex gap-3 justify-center'>
            <Button
              variant='outline'
              onClick={() => navigate('/landlord/properties')}
            >
              View All Properties
            </Button>
            <Button
              variant='gold'
              onClick={() => {
                setSubmitted(false)
                setStep(1)
                setForm(initialFormState)
                setImages([])
                setImagePreviews([])
              }}
            >
              Add Another
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <SEO title={isEdit ? 'Edit Property' : 'Add Property'} />

      <div className='max-w-2xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-white font-display'>
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Step {step} of {STEPS.length} — {STEPS[step - 1]}
          </p>
        </div>

        {/* Progress */}
        <div className='mb-6'>
          <div className='flex justify-between mb-2'>
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-1 text-[10px] font-medium ${
                  i + 1 <= step ? 'text-yellow-400' : 'text-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i + 1 < step
                      ? 'bg-yellow-500 text-black'
                      : i + 1 === step
                      ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                      : 'bg-surface-border text-gray-600'
                  }`}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className='hidden sm:inline'>{label}</span>
              </div>
            ))}
          </div>
          <ProgressBar value={step} max={5} height={4} />
        </div>

        {/* Form Steps */}
        <div className='bg-surface-card border border-surface-border rounded-2xl p-6'>
          {step === 1 && (
            <PropertyFormStep1
              values={form}
              errors={errors}
              onChange={handleChange}
              onGenerateDescription={handleGenerateDescription}
              aiGenerating={aiGenerating}
            />
          )}
          {step === 2 && (
            <PropertyFormStep2
              values={form}
              errors={errors}
              onChange={handleChange}
            />
          )}
          {step === 3 && (
            <PropertyFormStep3
              values={form}
              errors={errors}
              onChange={handleChange}
            />
          )}
          {step === 4 && (
            <PropertyFormStep4
              values={form}
              errors={errors}
              onChange={handleChange}
              onToggleAmenity={handleToggleAmenity}
            />
          )}
          {step === 5 && (
            <PropertyFormStep5
              values={form}
              errors={errors}
              onChange={handleChange}
              onImagesChange={handleImagesChange}
              imagePreviews={imagePreviews}
              onRemoveImage={handleRemoveImage}
            />
          )}

          {/* Navigation */}
          <div className='flex justify-between mt-6 pt-4 border-t border-surface-border'>
            <Button
              variant='outline'
              icon={ChevronLeft}
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            {step < 5 ? (
              <Button
                variant='gold'
                icon={ChevronRight}
                iconPosition='right'
                onClick={nextStep}
              >
                Next Step
              </Button>
            ) : (
              <Button variant='gold' loading={loading} onClick={handleSubmit}>
                {isEdit ? 'Save Changes' : 'Submit Property'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AddEditProperty
