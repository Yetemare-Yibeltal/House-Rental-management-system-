// nestfind/nestfind/client/src/components/ui/GoldCursor.jsx

import { useEffect, useRef } from 'react'

const GoldCursor = () => {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef(null)

  useEffect(() => {
    // Only show on desktop
    if (window.innerWidth < 768) return

    const moveMouse = e => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`
        dotRef.current.style.top = `${e.clientY}px`
      }
    }

    const animateRing = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.12
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.12

      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`
        ringRef.current.style.top = `${ringPos.current.y}px`
      }

      animFrameRef.current = requestAnimationFrame(animateRing)
    }

    const handleMouseDown = () => {
      if (dotRef.current) {
        dotRef.current.style.width = '12px'
        dotRef.current.style.height = '12px'
      }
      if (ringRef.current) {
        ringRef.current.style.width = '20px'
        ringRef.current.style.height = '20px'
        ringRef.current.style.borderColor = 'rgba(201,168,76,1)'
      }
    }

    const handleMouseUp = () => {
      if (dotRef.current) {
        dotRef.current.style.width = '8px'
        dotRef.current.style.height = '8px'
      }
      if (ringRef.current) {
        ringRef.current.style.width = '32px'
        ringRef.current.style.height = '32px'
        ringRef.current.style.borderColor = 'rgba(201,168,76,0.6)'
      }
    }

    const handleMouseEnterLink = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '48px'
        ringRef.current.style.height = '48px'
        ringRef.current.style.borderColor = 'rgba(201,168,76,0.8)'
      }
    }

    const handleMouseLeaveLink = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '32px'
        ringRef.current.style.height = '32px'
        ringRef.current.style.borderColor = 'rgba(201,168,76,0.6)'
      }
    }

    const addLinkListeners = () => {
      document
        .querySelectorAll('a, button, [role="button"], input, select, textarea')
        .forEach(el => {
          el.addEventListener('mouseenter', handleMouseEnterLink)
          el.addEventListener('mouseleave', handleMouseLeaveLink)
        })
    }

    document.addEventListener('mousemove', moveMouse)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    animFrameRef.current = requestAnimationFrame(animateRing)
    addLinkListeners()

    const observer = new MutationObserver(addLinkListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', moveMouse)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      observer.disconnect()
    }
  }, [])

  if (typeof window !== 'undefined' && window.innerWidth < 768) return null

  return (
    <>
      <div ref={dotRef} className='cursor-dot' />
      <div ref={ringRef} className='cursor-ring' />
    </>
  )
}

export default GoldCursor
