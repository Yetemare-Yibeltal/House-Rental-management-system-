// nestfind/nestfind/client/src/components/layout/PublicLayout.jsx

import Navbar from './Navbar'
import Footer from './Footer'
import Toast from '../ui/Toast'
import GoldCursor from '../ui/GoldCursor'
import { useAIStore } from '../../context/AIContext'
import AIChatAssistant from '../ai/AIChatAssistant'

const PublicLayout = ({ children, showFooter = true }) => {
  const { isChatOpen } = useAIStore()

  return (
    <div className='min-h-screen bg-dark flex flex-col'>
      <GoldCursor />
      <Toast />
      <Navbar />

      <main className='flex-1 pt-16'>{children}</main>

      {showFooter && <Footer />}

      {/* AI Chat Floating */}
      <AIChatAssistant />
    </div>
  )
}

export default PublicLayout
