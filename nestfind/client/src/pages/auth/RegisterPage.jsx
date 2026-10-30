import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Building2, Users } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../hooks/useAuth';

const ROLES = [
  { value: 'tenant', icon: Users, title: 'I am a Tenant', description: 'Looking for a rental property' },
  { value: 'landlord', icon: Building2, title: 'I am a Landlord', description: 'I want to list my property' },
];

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'tenant' });
  const [errors, setErrors] = useState({});

  const set = (name, value) => { setForm((p) => ({ ...p, [name]: value })); setErrors((p) => ({ ...p, [name]: '' })); };
  const handleChange = (e) => set(e.target.name, e.target.value);

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = 'First name is required';
    if (!form.lastName) e.lastName = 'Last name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must include a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await register(form);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join thousands of Ethiopians on NestFind">
      <SEO title="Register" description="Create your NestFind account" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, icon: Icon, title, description }) => (
            <button key={value} type="button" onClick={() => set('role', value)}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border text-center transition-all ${form.role === value ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/30'}`}>
              <Icon size={20} />
              <span className="text-xs font-bold">{title}</span>
              <span className="text-[10px] leading-tight opacity-70">{description}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} icon={User} placeholder="First name" />
          <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} placeholder="Last name" />
        </div>
        <Input label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} error={errors.email} icon={Mail} placeholder="you@example.com" />
        <Input label="Phone Number (optional)" type="tel" name="phone" value={form.phone} onChange={handleChange} icon={Phone} placeholder="0911234567" hint="Ethiopian format: 09XXXXXXXX or +251XXXXXXXXX" />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} icon={Lock} placeholder="Create a strong password" />
        <Input label="Confirm Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={Lock} placeholder="Confirm your password" />

        <p className="text-xs text-gray-500 leading-relaxed">
          By creating an account, you agree to our <Link to="/trust" className="text-yellow-400 hover:underline">Terms of Service</Link> and <Link to="/trust" className="text-yellow-400 hover:underline">Privacy Policy</Link>.
        </p>

        <Button type="submit" variant="gold" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">Create Account</Button>

        <p className="text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
