// nestfind/nestfind/client/src/components/ui/PageTransition.jsx

import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25
}

const PageTransition = ({ children, className = '' }) => {
  const location = useLocation()

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={location.pathname}
        initial='initial'
        animate='animate'
        exit='exit'
        variants={pageVariants}
        transition={pageTransition}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
