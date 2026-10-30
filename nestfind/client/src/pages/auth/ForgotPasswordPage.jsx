import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../hooks/useAuth';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    const result = await forgotPassword(email);
    if (result.success) setSubmitted(true);
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send a reset code">
      <SEO title="Forgot Password" />
      {submitted ? (
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle size={30} className="text-green-400" />
          </div>
          <div>
            <p className="text-base font-bold text-white mb-2">Check your email</p>
            <p className="text-sm text-gray-400 leading-relaxed">If an account exists for <strong className="text-white">{email}</strong>, we've sent a 6-digit reset code.</p>
          </div>
          <Link to="/reset-password" state={{ email }} className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl">
            Enter Reset Code <ArrowRight size={16} />
          </Link>
          <button onClick={() => setSubmitted(false)} className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">Try a different email</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email Address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} error={error} icon={Mail} placeholder="Enter your registered email" autoFocus />
          <Button type="submit" variant="gold" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">Send Reset Code</Button>
          <div className="text-center"><Link to="/login" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">← Back to Login</Link></div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
