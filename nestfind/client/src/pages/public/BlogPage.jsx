// nestfind/nestfind/client/src/pages/public/BlogPage.jsx

import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Calendar, User, Tag, ArrowLeft, Clock } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { PropertyCardSkeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import GradientText from '../../components/ui/GradientText'
import SEO from '../../components/common/SEO'
import api from '../../api/axios'
import { formatDate, truncateWords } from '../../utils/formatters'

const BlogCard = ({ post }) => (
  <Link
    to={`/blog/${post.slug}`}
    className='group block bg-surface-card border border-surface-border rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all'
  >
    {post.coverImage?.url && (
      <div className='h-48 overflow-hidden'>
        <img
          src={post.coverImage.url}
          alt={post.title}
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
        />
      </div>
    )}
    <div className='p-5'>
      <div className='flex items-center gap-3 mb-3'>
        <span className='px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold rounded-full capitalize'>
          {post.category?.replace(/_/g, ' ')}
        </span>
        <span className='text-xs text-gray-500 flex items-center gap-1'>
          <Clock size={11} />
          {post.readTime || '5 min read'}
        </span>
      </div>
      <h3 className='text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors font-display'>
        {post.title}
      </h3>
      <p className='text-sm text-gray-400 line-clamp-3 mb-4'>
        {post.excerpt || truncateWords(post.content, 25)}
      </p>
      <div className='flex items-center justify-between text-xs text-gray-500'>
        <span className='flex items-center gap-1'>
          <Calendar size={11} />
          {formatDate(post.publishedAt)}
        </span>
        <span className='flex items-center gap-1'>
          <User size={11} />
          {post.author?.firstName} {post.author?.lastName}
        </span>
      </div>
    </div>
  </Link>
)

const BlogPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [singlePost, setSinglePost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (slug) {
      fetchPost(slug)
    } else {
      fetchPosts(1)
    }
  }, [slug])

  const fetchPosts = async page => {
    setLoading(true)
    try {
      const response = await api.get(`/blog?page=${page}&limit=9`)
      setPosts(response.data.data || [])
      setTotalPages(Math.ceil((response.data.pagination?.total || 0) / 9))
      setCurrentPage(page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const fetchPost = async postSlug => {
    setLoading(true)
    try {
      const response = await api.get(`/blog/${postSlug}`)
      setSinglePost(response.data.data.post)
      setRelated(response.data.data.related || [])
    } catch {
      navigate('/blog')
    } finally {
      setLoading(false)
    }
  }

  if (slug && singlePost) {
    return (
      <PublicLayout>
        <SEO
          title={singlePost.title}
          description={singlePost.excerpt}
          image={singlePost.coverImage?.url}
        />
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
          <button
            onClick={() => navigate('/blog')}
            className='flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors mb-6'
          >
            <ArrowLeft size={14} /> Back to Blog
          </button>
          {singlePost.coverImage?.url && (
            <div className='h-72 rounded-2xl overflow-hidden mb-6'>
              <img
                src={singlePost.coverImage.url}
                alt={singlePost.title}
                className='w-full h-full object-cover'
              />
            </div>
          )}
          <div className='flex flex-wrap items-center gap-3 mb-4'>
            <span className='px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full capitalize'>
              {singlePost.category?.replace(/_/g, ' ')}
            </span>
            <span className='text-xs text-gray-500'>
              {formatDate(singlePost.publishedAt)}
            </span>
            <span className='text-xs text-gray-500'>
              By {singlePost.author?.firstName} {singlePost.author?.lastName}
            </span>
          </div>
          <h1 className='text-3xl font-bold font-display text-white mb-6'>
            {singlePost.title}
          </h1>
          <div className='prose-dark text-sm leading-relaxed whitespace-pre-line'>
            {singlePost.content}
          </div>
          {singlePost.tags?.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-8 pt-6 border-t border-surface-border'>
              {singlePost.tags.map(tag => (
                <span
                  key={tag}
                  className='flex items-center gap-1 px-2.5 py-1 bg-surface-light border border-surface-border rounded-full text-xs text-gray-400'
                >
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
          {related.length > 0 && (
            <div className='mt-10'>
              <h3 className='text-lg font-bold text-white font-display mb-4'>
                Related Posts
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {related.map(p => (
                  <BlogCard key={p._id} post={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <SEO
        title='Blog'
        description='NestFind blog — rental tips, landlord guides, market news, and AI features.'
      />
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='text-center mb-10'>
          <h1 className='text-3xl font-bold font-display text-white'>
            <GradientText>NestFind</GradientText> Blog
          </h1>
          <p className='text-gray-400 text-sm mt-2'>
            Rental tips, market insights, and guides for Ethiopian renters
          </p>
        </div>
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {Array.from({ length: 9 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
              {posts.map(post => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className='flex justify-center mt-8'>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={fetchPosts}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  )
}

export default BlogPage
