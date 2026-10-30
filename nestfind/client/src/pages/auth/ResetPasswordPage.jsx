import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../hooks/useAuth';
import { useOTP } from '../../hooks/useOTP';

const Strength = ({ password }) => {
  if (!password) return null;
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score - 1] : 'bg-surface-border'}`} />)}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, pass }) => <div key={label} className={`text-[10px] ${pass ? 'text-green-400' : 'text-gray-500'}`}>{pass ? '✓' : '○'} {label}</div>)}
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  const location = useLocation();
  const email = location.state?.email || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading } = useAuth();
  const { otp, isComplete, error: otpError, inputRefs, handleChange: handleOTPChange, handleKeyDown, handlePaste } = useOTP('password_reset');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isComplete) errs.otp = 'Please enter the 6-digit code';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const result = await resetPassword({ email, otp: otp.join(''), password, confirmPassword });
    if (result.success) setSuccess(true);
  };

  return (
    <AuthLayout title="Reset your password" subtitle={email ? `Enter the code sent to ${email} and your new password` : 'Enter your code and new password'}>
      <SEO title="Reset Password" />
      {success ? (
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto"><CheckCircle size={30} className="text-green-400" /></div>
          <div>
            <p className="text-lg font-bold text-white mb-2">Password Reset!</p>
            <p className="text-sm text-gray-400">Your password has been changed successfully.</p>
          </div>
          <Link to="/login" className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl">Sign In <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} onPaste={handlePaste}
                  className={`w-10 h-12 text-center text-lg font-bold rounded-xl border outline-none bg-surface-card text-white ${digit ? 'border-yellow-500 bg-yellow-500/10' : 'border-surface-border focus:border-yellow-500'} ${errors.otp || otpError ? 'border-red-500' : ''}`} />
              ))}
            </div>
            {(errors.otp || otpError) && <p className="text-xs text-red-400 text-center mt-1">{errors.otp || otpError}</p>}
          </div>
          <div>
            <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} icon={Lock} placeholder="Create a strong password" />
            <Strength password={password} />
          </div>
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} icon={Lock} placeholder="Confirm your new password" />
          <Button type="submit" variant="gold" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">Reset Password</Button>
          <div className="text-center"><Link to="/forgot-password" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">← Send a new code</Link></div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
