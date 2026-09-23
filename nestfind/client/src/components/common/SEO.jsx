// nestfind/nestfind/client/src/components/common/SEO.jsx

import { useEffect } from 'react'

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}) => {
  const siteName = 'NestFind'
  const defaultDescription =
    "Ethiopia's Premier AI-Powered House Rental Platform."
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} — AI-Powered House Rental Ethiopia`

  useEffect(() => {
    document.title = fullTitle
    const setMeta = (name, content, isProperty = false) => {
      if (!content) return
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('description', description || defaultDescription)
    if (keywords) setMeta('keywords', keywords)
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description || defaultDescription, true)
    setMeta('og:type', type, true)
    if (url) setMeta('og:url', url, true)
    if (image) setMeta('og:image', image, true)
  }, [fullTitle, description, keywords, image, url, type])

  return null
}

export default SEO
