// nestfind/nestfind/client/src/pages/landlord/AddEditProperty.jsx

import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PropertyFormStep1 from '../../components/landlord/PropertyFormStep1'
import PropertyFormStep2 from '../../components/landlord/PropertyFormStep2'
import PropertyFormStep3 from '../../components/landlord/PropertyFormStep3'
import PropertyFormStep4 from '../../components/landlord/PropertyFormStep4'
import PropertyFormStep5 from '../../components/landlord/PropertyFormStep5'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import SEO from '../../components/common/SEO'
import { usePropertyForm } from '../../hooks/usePropertyForm'

const STEP_LABELS = ['Basic Info', 'Location', 'Details', 'Pricing', 'Photos']

const AddEditProperty = () => {
  const { id } = useParams()
  const {
    values,
    errors,
    currentStep,
    totalSteps,
    loading,
    images,
    imagePreviews,
    aiGenerating,
    setValue,
    toggleAmenity,
    handleImageSelect,
    removeImage,
    nextStep,
    prevStep,
    generateAIDescription,
    submit
  } = usePropertyForm(id || null)

  const onChange = (field, value) => setValue(field, value)

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PropertyFormStep1
            values={values}
            errors={errors}
            onChange={onChange}
            onGenerateDescription={generateAIDescription}
            aiGenerating={aiGenerating}
          />
        )
      case 2:
        return (
          <PropertyFormStep2
            values={values}
            errors={errors}
            onChange={onChange}
          />
        )
      case 3:
        return (
          <PropertyFormStep3
            values={values}
            errors={errors}
            onChange={onChange}
          />
        )
      case 4:
        return (
          <PropertyFormStep4
            values={values}
            errors={errors}
            onChange={onChange}
            onToggleAmenity={toggleAmenity}
          />
        )
      case 5:
        return (
          <PropertyFormStep5
            values={values}
            errors={errors}
            onChange={onChange}
            onImagesChange={handleImageSelect}
            imagePreviews={imagePreviews}
            onRemoveImage={removeImage}
          />
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <SEO title={id ? 'Edit Property' : 'Add Property'} />

      <div className='max-w-2xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-white font-display'>
            {id ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Step {currentStep} of {totalSteps} — {STEP_LABELS[currentStep - 1]}
          </p>
        </div>

        {/* Progress */}
        <div className='mb-6'>
          <div className='flex justify-between mb-2'>
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-medium ${
                  i + 1 <= currentStep ? 'text-yellow-400' : 'text-gray-600'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <ProgressBar value={currentStep} max={totalSteps} height={6} />
        </div>

        {/* Step Content */}
        <div className='bg-surface-card border border-surface-border rounded-2xl p-6 mb-5'>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className='flex gap-3'>
          {currentStep > 1 && (
            <Button
              variant='outline'
              fullWidth
              onClick={prevStep}
              disabled={loading}
            >
              Previous
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button variant='gold' fullWidth onClick={nextStep}>
              Next Step →
            </Button>
          ) : (
            <Button variant='gold' fullWidth loading={loading} onClick={submit}>
              {id ? 'Update Property' : 'Submit for Review'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AddEditProperty
