// nestfind/nestfind/client/src/components/layout/Footer.jsx

import { Link } from 'react-router-dom'
import {
  Home,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react'
import GradientText from '../ui/GradientText'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const links = {
    platform: [
      { to: '/listings', label: 'Browse Properties' },
      { to: '/search', label: 'AI Smart Search' },
      { to: '/about', label: 'About NestFind' },
      { to: '/blog', label: 'Blog' },
      { to: '/faq', label: 'FAQ' }
    ],
    tenants: [
      { to: '/register', label: 'Create Account' },
      { to: '/login', label: 'Sign In' },
      { to: '/tenant/dashboard', label: 'Tenant Dashboard' },
      { to: '/tenant/bookings', label: 'My Bookings' },
      { to: '/tenant/contracts', label: 'My Contracts' }
    ],
    landlords: [
      { to: '/register', label: 'List Your Property' },
      { to: '/landlord/dashboard', label: 'Landlord Dashboard' },
      { to: '/landlord/properties', label: 'My Properties' },
      { to: '/landlord/analytics', label: 'Analytics' }
    ],
    legal: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/contact', label: 'Contact Us' },
      { to: '/trust', label: 'Trust & Safety' }
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ]

  return (
    <footer className='bg-dark border-t border-surface-border mt-auto'>
      {/* Main Footer */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8'>
          {/* Brand */}
          <div className='lg:col-span-2'>
            <Link to='/' className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center'>
                <Home size={16} className='text-black' />
              </div>
              <span className='text-lg font-bold font-display'>
                <GradientText>NestFind</GradientText>
              </span>
            </Link>

            <p className='text-gray-400 text-sm leading-relaxed mb-4'>
              Ethiopia's premier AI-powered house rental platform. Find verified
              rentals in Addis Ababa with intelligent search, digital contracts,
              and seamless payments.
            </p>

            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <MapPin size={12} />
                <span>Bole, Addis Ababa, Ethiopia</span>
              </div>

              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <Mail size={12} />
                <a
                  href='mailto:support@nestfind.et'
                  className='hover:text-yellow-400 transition-colors'
                >
                  support@nestfind.et
                </a>
              </div>

              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <Phone size={12} />
                <a
                  href='tel:+251911000000'
                  className='hover:text-yellow-400 transition-colors'
                >
                  +251 911 000 000
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className='flex gap-3 mt-5'>
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className='w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:border-yellow-500/30 transition-all'
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className='text-sm font-semibold text-white mb-3'>Platform</h4>
            <ul className='space-y-2'>
              {links.platform.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className='text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tenant Links */}
          <div>
            <h4 className='text-sm font-semibold text-white mb-3'>
              For Tenants
            </h4>
            <ul className='space-y-2'>
              {links.tenants.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className='text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Landlord Links */}
          <div>
            <h4 className='text-sm font-semibold text-white mb-3'>
              For Landlords
            </h4>
            <ul className='space-y-2'>
              {links.landlords.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className='text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className='text-sm font-semibold text-white mb-3'>Legal</h4>
            <ul className='space-y-2'>
              {links.legal.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className='text-xs text-gray-400 hover:text-yellow-400 transition-colors'
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-surface-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
            <p className='text-xs text-gray-500'>
              © {currentYear} NestFind. All rights reserved. Built with ❤️ for
              Ethiopia.
            </p>

            <div className='flex items-center gap-1'>
              <span className='text-xs text-gray-500'>Powered by</span>
              <span className='text-xs font-semibold text-yellow-500/80'>
                Claude AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
