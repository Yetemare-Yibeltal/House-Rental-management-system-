import { useState } from 'react';
import { Save } from 'lucide-react';
import adminApi from '../../api/adminApi';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'rental_tips', label: 'Rental Tips' },
  { value: 'landlord_guide', label: 'Landlord Guide' },
  { value: 'tenant_guide', label: 'Tenant Guide' },
  { value: 'market_news', label: 'Market News' },
  { value: 'legal_advice', label: 'Legal Advice' },
  { value: 'neighborhood_guide', label: 'Neighborhood Guide' },
  { value: 'ai_features', label: 'AI Features' },
  { value: 'company_news', label: 'Company News' },
  { value: 'other', label: 'Other' },
];

const BlogEditor = ({ post = null, onSuccess }) => {
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    category: post?.category || '',
    excerpt: post?.excerpt || '',
    tags: post?.tags?.join(', ') || '',
    status: post?.status || 'draft',
    isFeatured: !!post?.isFeatured,
  });
  const [cover, setCover] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.category) { toast.error('Title, content and category are required'); return; }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('content', form.content);
      data.append('category', form.category);
      data.append('excerpt', form.excerpt);
      data.append('status', form.status);
      data.append('isFeatured', form.isFeatured);
      data.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)));
      if (cover[0]) data.append('cover', cover[0]);

      if (post) await adminApi.updatePost(post._id, data);
      else await adminApi.createPost(data);
      toast.success(post ? 'Blog post updated' : 'Blog post created');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Post Title" placeholder="Enter a compelling title..." value={form.title} onChange={(e) => set('title', e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} options={CATEGORIES} placeholder="Select category" required />
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)}
          options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'scheduled', label: 'Scheduled' }]} />
      </div>
      <FileUpload label="Cover Image" accept="image/*" maxSize={3 * 1024 * 1024} onFilesChange={setCover} hint="Recommended: 1200x630px" />
      <Textarea label="Excerpt" placeholder="Brief summary shown in listings..." value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} maxLength={300} showCount />
      <Textarea label="Content" placeholder="Write your blog post here..." value={form.content} onChange={(e) => set('content', e.target.value)} rows={12} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Tags (comma separated)" placeholder="rental, Ethiopia, Addis Ababa" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-300">Featured Post</span>
          </label>
        </div>
      </div>
      <Button type="submit" variant="gold" fullWidth loading={loading} icon={Save}>{post ? 'Update Post' : 'Save Post'}</Button>
    </form>
  );
};

export default BlogEditor;
