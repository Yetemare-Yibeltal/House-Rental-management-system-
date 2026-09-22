// nestfind/nestfind/client/src/pages/admin/BlogCMS.jsx

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import BlogEditor from '../../components/admin/BlogEditor'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const BlogCMS = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getPosts({ page: 1, limit: 20 })
      setPosts(response.data.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminApi.deletePost(deleteId)
      toast.success('Post deleted')
      setDeleteId(null)
      fetchPosts()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='Blog CMS' />
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Blog CMS
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Manage blog posts and articles
          </p>
        </div>
        <Button
          variant='gold'
          size='sm'
          icon={Plus}
          onClick={() => {
            setEditingPost(null)
            setShowEditor(true)
          }}
        >
          New Post
        </Button>
      </div>

      <div className='space-y-3'>
        {posts.map(post => (
          <div
            key={post._id}
            className='flex items-center gap-4 bg-surface-card border border-surface-border rounded-2xl p-4 hover:border-yellow-500/20 transition-all'
          >
            {post.coverImage?.url && (
              <img
                src={post.coverImage.url}
                alt=''
                className='w-16 h-12 object-cover rounded-xl flex-shrink-0'
              />
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-0.5'>
                <p className='text-sm font-bold text-white line-clamp-1'>
                  {post.title}
                </p>
                {post.isFeatured && (
                  <Badge variant='gold' size='xs'>
                    Featured
                  </Badge>
                )}
              </div>
              <div className='flex items-center gap-3 text-xs text-gray-400'>
                <Badge status={post.status} size='xs' />
                <span className='capitalize'>
                  {post.category?.replace(/_/g, ' ')}
                </span>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
            </div>
            <div className='flex gap-2 flex-shrink-0'>
              <button
                onClick={() => {
                  setEditingPost(post)
                  setShowEditor(true)
                }}
                className='p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setDeleteId(post._id)}
                className='p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        title={editingPost ? 'Edit Post' : 'New Blog Post'}
        size='xl'
      >
        <BlogEditor
          post={editingPost}
          onSuccess={() => {
            setShowEditor(false)
            fetchPosts()
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete Post?'
        message='This will permanently delete the blog post.'
        type='danger'
        confirmLabel='Delete'
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default BlogCMS
