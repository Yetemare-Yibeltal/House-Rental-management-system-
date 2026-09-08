// nestfind/nestfind/client/src/components/ui/Toast.jsx

import { Toaster } from 'react-hot-toast'

const Toast = () => {
  return (
    <Toaster
      position='top-right'
      reverseOrder={false}
      gutter={8}
      containerStyle={{ top: 80 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#13141f',
          color: '#f0f0f0',
          border: '1px solid #2a2b3a',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          padding: '12px 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          maxWidth: '380px'
        },
        success: {
          style: {
            borderColor: 'rgba(201,168,76,0.4)'
          },
          iconTheme: {
            primary: '#c9a84c',
            secondary: '#07080f'
          }
        },
        error: {
          style: {
            borderColor: 'rgba(239,68,68,0.4)'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff'
          }
        },
        loading: {
          style: {
            borderColor: 'rgba(201,168,76,0.3)'
          },
          iconTheme: {
            primary: '#c9a84c',
            secondary: '#07080f'
          }
        }
      }}
    />
  )
}

export default Toast
