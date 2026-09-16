// nestfind/nestfind/client/src/pages/public/AboutPage.jsx

import { Link } from 'react-router-dom'
import {
  Bot,
  Shield,
  CreditCard,
  FileText,
  Users,
  Building2,
  Star
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import GradientText from '../../components/ui/GradientText'
import SEO from '../../components/common/SEO'

const FEATURES = [
  {
    icon: Bot,
    title: 'AI-Powered Search',
    description:
      'Natural language property search understands exactly what you need. Just describe your perfect home.'
  },
  {
    icon: Shield,
    title: 'Verified Listings',
    description:
      'Every landlord is KYC verified. Every listing is reviewed. Our AI fraud detection protects tenants 24/7.'
  },
  {
    icon: FileText,
    title: 'Digital Contracts',
    description:
      'Sign lease agreements digitally. AI explains every clause in plain language before you sign.'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description:
      'Pay rent via Telebirr, CBE, or bank transfer. Automatic receipts and payment history tracking.'
  },
  {
    icon: Users,
    title: 'Maintenance Tracking',
    description:
      'Submit maintenance requests with AI diagnosis. Track every request from submission to completion.'
  },
  {
    icon: Star,
    title: 'Transparent Reviews',
    description:
      'Verified reviews from real tenants and landlords help you make better decisions.'
  }
]

const TEAM = [
  {
    name: 'Selam Yibeltal',
    role: 'Founder & CEO',
    description: "Building Ethiopia's future of rental housing."
  },
  {
    name: 'Tech Team',
    role: 'Engineering',
    description: 'Powered by Claude AI and modern web technologies.'
  }
]

const AboutPage = () => {
  return (
    <PublicLayout>
      <SEO
        title='About NestFind'
        description="NestFind is Ethiopia's premier AI-powered house rental platform connecting verified tenants with trusted landlords."
      />

      {/* Hero */}
      <section className='relative py-20 px-4 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-dark via-surface-card to-dark' />
        <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/8 rounded-full blur-3xl' />
        <div className='relative max-w-4xl mx-auto text-center'>
          <ScrollReveal animation='fadeUp'>
            <span className='text-xs font-semibold text-yellow-400 uppercase tracking-wider'>
              About NestFind
            </span>
            <h1 className='text-4xl sm:text-5xl font-bold font-display text-white mt-3 mb-5'>
              Reimagining Rental in <GradientText>Ethiopia</GradientText>
            </h1>
            <p className='text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto'>
              NestFind was built to solve the frustrations of renting in
              Ethiopia — fake listings, opaque contracts, unreliable payments,
              and zero accountability. We built a platform where technology
              creates trust.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission */}
      <section className='py-16 px-4'>
        <div className='max-w-5xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <ScrollReveal animation='fadeRight'>
              <h2 className='text-3xl font-bold font-display text-white mb-4'>
                Our <GradientText>Mission</GradientText>
              </h2>
              <p className='text-gray-400 leading-relaxed mb-4'>
                We believe every Ethiopian deserves a safe, transparent, and
                dignified rental experience. Too many tenants have lost money to
                fake listings. Too many landlords struggle to find reliable
                tenants.
              </p>
              <p className='text-gray-400 leading-relaxed mb-4'>
                NestFind combines the power of AI with human verification to
                create a rental marketplace built on trust. Every landlord is
                identity-verified. Every listing is fraud-screened. Every
                contract is digitally signed and legally binding.
              </p>
              <p className='text-gray-400 leading-relaxed'>
                We are starting in Addis Ababa and expanding to every corner of
                Ethiopia.
              </p>
            </ScrollReveal>

            <ScrollReveal animation='fadeLeft'>
              <div className='grid grid-cols-2 gap-4'>
                {[
                  { value: '5,000+', label: 'Properties Listed' },
                  { value: '2,000+', label: 'Happy Tenants' },
                  { value: '1,000+', label: 'Verified Landlords' },
                  { value: '99%', label: 'Fraud Prevention Rate' }
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className='bg-surface-card border border-surface-border rounded-2xl p-5 text-center'
                  >
                    <p className='text-2xl font-bold font-display'>
                      <GradientText>{value}</GradientText>
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>{label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='py-16 px-4 bg-surface-card/30'>
        <div className='max-w-6xl mx-auto'>
          <ScrollReveal animation='fadeUp'>
            <div className='text-center mb-10'>
              <h2 className='text-3xl font-bold font-display text-white'>
                Why Choose <GradientText>NestFind</GradientText>
              </h2>
            </div>
          </ScrollReveal>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <ScrollReveal key={title} animation='fadeUp' delay={i * 0.08}>
                <div className='bg-surface-card border border-surface-border rounded-2xl p-6 hover:border-yellow-500/30 transition-all'>
                  <div className='w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4'>
                    <Icon size={22} className='text-yellow-400' />
                  </div>
                  <h3 className='text-base font-bold text-white mb-2 font-display'>
                    {title}
                  </h3>
                  <p className='text-sm text-gray-400 leading-relaxed'>
                    {description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-16 px-4'>
        <div className='max-w-2xl mx-auto text-center'>
          <ScrollReveal animation='scale'>
            <div className='bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-3xl p-10'>
              <h2 className='text-2xl font-bold font-display text-white mb-3'>
                Ready to find your <GradientText>perfect home</GradientText>?
              </h2>
              <p className='text-gray-400 text-sm mb-6'>
                Join thousands of Ethiopians who trust NestFind for their rental
                needs.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Link
                  to='/register'
                  className='px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl hover:shadow-gold transition-all'
                >
                  Get Started Free
                </Link>
                <Link
                  to='/listings'
                  className='px-6 py-3 border border-surface-border text-gray-300 font-medium rounded-xl hover:border-yellow-500/50 hover:text-yellow-400 transition-all'
                >
                  Browse Properties
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicLayout>
  )
}

export default AboutPage
