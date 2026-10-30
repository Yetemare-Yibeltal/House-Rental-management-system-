import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await login({ ...form, from });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your NestFind account">
      <SEO title="Login" description="Sign in to your NestFind account" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} error={errors.email} icon={Mail} placeholder="you@example.com" autoComplete="email" />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} icon={Lock} placeholder="Your password" autoComplete="current-password" />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-300">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Forgot password?</Link>
        </div>

        <Button type="submit" variant="gold" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">Sign In</Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-xs text-gray-500">New to NestFind?</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        <Link to="/register" className="flex items-center justify-center w-full py-2.5 border border-surface-border rounded-xl text-sm font-medium text-gray-300 hover:border-yellow-500/50 hover:text-yellow-400 transition-all">
          Create a free account
        </Link>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
