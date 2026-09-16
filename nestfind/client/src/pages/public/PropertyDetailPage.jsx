// nestfind/nestfind/client/src/pages/public/PropertyDetailPage.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bed,
  Bath,
  Maximize,
  Calendar,
  MapPin,
  Shield,
  Share2,
  Flag,
  CheckCircle,
  Building2
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import PropertyImageGallery from '../../components/property/PropertyImageGallery'
import BookingForm from '../../components/property/BookingForm'
import SimilarProperties from '../../components/property/SimilarProperties'
import ReviewCard from '../../components/property/ReviewCard'
import PropertyMap from '../../components/property/PropertyMap'
import { AmenitiesGrid } from '../../components/property/AmenityBadge'
import FraudWarning from '../../components/ai/FraudWarning'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { RatingDisplay } from '../../components/ui/StarRating'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import propertyApi from '../../api/propertyApi'
import {
  formatCurrency,
  formatDate,
  formatFurnished,
  formatArea,
  formatBedrooms
} from '../../utils/formatters'
import { copyToClipboard } from '../../utils/helpers'
import toast from 'react-hot-toast'

const PropertyDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true)
      try {
        const response = await propertyApi.getProperty(id)
        setData(response.data.data)
      } catch {
        navigate('/listings')
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id, navigate])

  if (loading)
    return (
      <PublicLayout>
        <PageLoader text='Loading property...' />
      </PublicLayout>
    )
  if (!data) return null

  const { property, similarProperties, reviews, images, isSaved } = data
  const {
    title,
    description,
    propertyType,
    location,
    details,
    pricing,
    amenities,
    landlord,
    stats,
    isVerified,
    isFeatured,
    leaseTerms,
    ai
  } = property

  const handleShare = async () => {
    await copyToClipboard(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'reviews', label: `Reviews (${stats?.totalReviews || 0})` },
    { key: 'map', label: 'Location' }
  ]

  return (
    <PublicLayout>
      <SEO
        title={title}
        description={description?.slice(0, 160)}
        image={property.coverImage?.url}
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {/* Breadcrumb */}
        <div className='flex items-center gap-2 text-xs text-gray-500 mb-4'>
          <button
            onClick={() => navigate('/listings')}
            className='hover:text-yellow-400'
          >
            Properties
          </button>
          <span>/</span>
          <span className='text-gray-300'>{title}</span>
        </div>

        {/* Image Gallery */}
        <div className='mb-6'>
          <PropertyImageGallery
            images={images || property.images || []}
            title={title}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column */}
          <div className='lg:col-span-2 space-y-5'>
            {/* Header */}
            <div>
              <div className='flex flex-wrap items-start justify-between gap-3 mb-2'>
                <div className='flex flex-wrap gap-2'>
                  {isFeatured && (
                    <Badge variant='gold' size='sm'>
                      ⭐ Featured
                    </Badge>
                  )}
                  {isVerified && (
                    <div className='flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full'>
                      <CheckCircle size={11} className='text-green-400' />
                      <span className='text-xs font-semibold text-green-400'>
                        Verified
                      </span>
                    </div>
                  )}
                  <Badge variant='gray' size='sm' className='capitalize'>
                    {propertyType}
                  </Badge>
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={handleShare}
                    className='p-2 rounded-lg border border-surface-border text-gray-400 hover:text-yellow-400 hover:border-yellow-500/50 transition-all'
                  >
                    <Share2 size={15} />
                  </button>
                  <button className='p-2 rounded-lg border border-surface-border text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all'>
                    <Flag size={15} />
                  </button>
                </div>
              </div>

              <h1 className='text-xl sm:text-2xl font-bold text-white font-display mb-2'>
                {title}
              </h1>

              <div className='flex items-center gap-1.5 mb-3'>
                <MapPin size={13} className='text-yellow-500' />
                <span className='text-sm text-gray-400'>
                  {location?.address && `${location.address}, `}
                  {location?.subCity}, {location?.city || 'Addis Ababa'}
                </span>
              </div>

              {/* Key Specs */}
              <div className='flex flex-wrap gap-4'>
                <div className='flex items-center gap-1.5 text-sm text-gray-300'>
                  <Bed size={15} className='text-yellow-400' />
                  {formatBedrooms(details?.bedrooms)}
                </div>
                <div className='flex items-center gap-1.5 text-sm text-gray-300'>
                  <Bath size={15} className='text-yellow-400' />
                  {details?.bathrooms} Bathroom
                  {details?.bathrooms !== 1 ? 's' : ''}
                </div>
                <div className='flex items-center gap-1.5 text-sm text-gray-300'>
                  <Maximize size={15} className='text-yellow-400' />
                  {formatArea(details?.area)}
                </div>
                {details?.floorNumber > 0 && (
                  <div className='flex items-center gap-1.5 text-sm text-gray-300'>
                    <Building2 size={15} className='text-yellow-400' />
                    Floor {details.floorNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className='bg-surface-card border border-yellow-500/20 rounded-2xl p-5'>
              <div className='flex items-end justify-between'>
                <div>
                  <p className='text-3xl font-bold text-yellow-400 font-display'>
                    {formatCurrency(pricing?.monthlyRent)}
                  </p>
                  <p className='text-sm text-gray-400'>per month</p>
                </div>
                <div className='text-right'>
                  {pricing?.securityDeposit > 0 && (
                    <p className='text-sm text-gray-400'>
                      Deposit:{' '}
                      <span className='text-white font-semibold'>
                        {formatCurrency(pricing.securityDeposit)}
                      </span>
                    </p>
                  )}
                  <p className='text-sm text-gray-400'>
                    Utilities:{' '}
                    <span className='text-white capitalize'>
                      {pricing?.utilityBills || 'excluded'}
                    </span>
                  </p>
                  {pricing?.negotiable && (
                    <Badge variant='green' size='xs'>
                      Negotiable
                    </Badge>
                  )}
                </div>
              </div>
              {stats?.averageRating > 0 && (
                <div className='mt-3 pt-3 border-t border-surface-border'>
                  <RatingDisplay
                    value={stats.averageRating}
                    count={stats.totalReviews}
                    size='md'
                  />
                </div>
              )}
            </div>

            {/* Fraud Warning */}
            {ai?.isFraudSuspected && (
              <FraudWarning
                fraudData={{
                  fraudScore: ai.fraudScore,
                  verdict: ai.fraudScore > 70 ? 'likely_fraud' : 'suspicious',
                  flags: ai.fraudFlags,
                  analysis: `This listing has a fraud score of ${ai.fraudScore}/100.`
                }}
              />
            )}

            {/* Tabs */}
            <div className='border-b border-surface-border'>
              <div className='flex gap-1 overflow-x-auto'>
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === key
                        ? 'border-yellow-500 text-yellow-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'overview' && (
                <div className='space-y-5'>
                  <div>
                    <h3 className='text-base font-bold text-white mb-2'>
                      Description
                    </h3>
                    <p className='text-sm text-gray-300 leading-relaxed whitespace-pre-line'>
                      {description}
                    </p>
                  </div>

                  <div>
                    <h3 className='text-base font-bold text-white mb-3'>
                      Property Details
                    </h3>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                      {[
                        { label: 'Property Type', value: propertyType },
                        {
                          label: 'Furnished',
                          value: formatFurnished(details?.furnished)
                        },
                        { label: 'Area', value: formatArea(details?.area) },
                        {
                          label: 'Floor',
                          value:
                            details?.floorNumber !== undefined
                              ? `${details.floorNumber} of ${
                                  details?.totalFloors || '?'
                                }`
                              : 'N/A'
                        },
                        {
                          label: 'Parking',
                          value: `${details?.parkingSpaces || 0} space(s)`
                        },
                        {
                          label: 'Year Built',
                          value: details?.yearBuilt || 'N/A'
                        },
                        {
                          label: 'Min Lease',
                          value: `${leaseTerms?.minimumLease || 6} months`
                        },
                        {
                          label: 'Available From',
                          value: leaseTerms?.availableFrom
                            ? formatDate(leaseTerms.availableFrom)
                            : 'Now'
                        },
                        {
                          label: 'Notice Period',
                          value: `${leaseTerms?.noticePeriodDays || 30} days`
                        },
                        {
                          label: 'Pet Policy',
                          value: leaseTerms?.petPolicy || 'Contact landlord'
                        },
                        {
                          label: 'Smoking',
                          value: leaseTerms?.smokingPolicy || 'Contact landlord'
                        }
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className='bg-surface-card border border-surface-border rounded-xl p-3'
                        >
                          <p className='text-[10px] text-gray-500 mb-0.5'>
                            {label}
                          </p>
                          <p className='text-xs font-semibold text-white capitalize'>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'amenities' && (
                <div>
                  <h3 className='text-base font-bold text-white mb-3'>
                    Available Amenities
                  </h3>
                  <AmenitiesGrid amenities={amenities || {}} />
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className='space-y-4'>
                  {reviews?.length === 0 ? (
                    <p className='text-gray-400 text-sm'>
                      No reviews yet. Be the first to review!
                    </p>
                  ) : (
                    reviews?.map(review => (
                      <ReviewCard key={review._id} review={review} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'map' && (
                <PropertyMap location={location} title={title} />
              )}
            </div>

            {/* Similar Properties */}
            {similarProperties?.length > 0 && (
              <SimilarProperties properties={similarProperties} />
            )}
          </div>

          {/* Right Column — Booking + Landlord */}
          <div className='space-y-5'>
            {/* Landlord Card */}
            {landlord && (
              <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
                <h3 className='text-sm font-bold text-white mb-3'>Listed by</h3>
                <div className='flex items-center gap-3 mb-4'>
                  <Avatar
                    src={landlord.avatar?.url}
                    firstName={landlord.firstName}
                    lastName={landlord.lastName}
                    size='lg'
                  />
                  <div>
                    <p className='text-sm font-bold text-white'>
                      {landlord.firstName} {landlord.lastName}
                    </p>
                    <div className='flex items-center gap-1.5 mt-0.5'>
                      {landlord.isKYCVerified && (
                        <>
                          <CheckCircle size={12} className='text-green-400' />
                          <span className='text-xs text-green-400'>
                            Verified Landlord
                          </span>
                        </>
                      )}
                    </div>
                    {landlord.createdAt && (
                      <p className='text-xs text-gray-500 mt-0.5'>
                        Member since {formatDate(landlord.createdAt)}
                      </p>
                    )}
                  </div>
                </div>

                {landlord.landlordProfile?.responseRate > 0 && (
                  <div className='flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-surface-border mb-3'>
                    <span>Response Rate</span>
                    <span className='text-green-400 font-semibold'>
                      {landlord.landlordProfile.responseRate}%
                    </span>
                  </div>
                )}

                {stats?.totalViews > 0 && (
                  <p className='text-xs text-gray-500 flex items-center gap-1'>
                    <Shield size={11} /> {stats.totalViews} views ·{' '}
                    {stats.totalBookings || 0} booking requests
                  </p>
                )}
              </div>
            )}

            {/* Booking Form */}
            {!bookingSuccess ? (
              <BookingForm
                propertyId={id}
                landlordName={
                  landlord
                    ? `${landlord.firstName} ${landlord.lastName}`
                    : 'Landlord'
                }
                onSuccess={() => setBookingSuccess(true)}
              />
            ) : (
              <div className='bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center'>
                <CheckCircle
                  size={32}
                  className='text-green-400 mx-auto mb-3'
                />
                <p className='text-sm font-bold text-green-400 mb-1'>
                  Visit Request Sent!
                </p>
                <p className='text-xs text-gray-400'>
                  The landlord will respond within 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default PropertyDetailPage
