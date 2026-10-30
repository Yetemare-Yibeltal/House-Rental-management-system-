import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';
import { useOTP } from '../../hooks/useOTP';
import { useAuthStore } from '../../context/AuthContext';

const LABELS = {
  email_verification: 'Email Verification',
  password_reset: 'Password Reset',
  login_2fa: 'Login Verification',
  account_deletion: 'Account Deletion',
};

const OTPPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const purpose = location.state?.purpose || 'email_verification';
  const email = location.state?.email || user?.email || '';
  const dashboards = { admin: '/admin/dashboard', landlord: '/landlord/dashboard', tenant: '/tenant/dashboard' };
  const redirectTo = location.state?.redirectTo || dashboards[user?.role] || '/';

  const otpState = useOTP(purpose);
  const { otp, isComplete, loading, error, verified, inputRefs, isCountdownRunning, countdownFormatted, handleChange, handleKeyDown, handlePaste, sendOTP, verifyOTP } = otpState;

  useEffect(() => { sendOTP?.(); }, []);
  useEffect(() => {
    if (verified) { const t = setTimeout(() => navigate(redirectTo), 1500); return () => clearTimeout(t); }
  }, [verified]);

  return (
    <AuthLayout title={LABELS[purpose] || 'Verification'} subtitle={`Enter the 6-digit code sent to ${email}`}>
      <SEO title="Verify OTP" />
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${verified ? 'bg-green-500/20 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
            <ShieldCheck size={30} className={verified ? 'text-green-400' : 'text-yellow-400'} />
          </div>
        </div>

        {verified ? (
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-green-400">Verified Successfully!</p>
            <p className="text-sm text-gray-400">Redirecting you...</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} onPaste={handlePaste}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all bg-surface-card text-white ${digit ? 'border-yellow-500 bg-yellow-500/10' : 'border-surface-border focus:border-yellow-500'} ${error ? 'border-red-500' : ''}`} />
              ))}
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button variant="gold" fullWidth loading={loading} disabled={!isComplete} onClick={verifyOTP}>Verify Code</Button>
            <div className="text-center">
              {isCountdownRunning ? (
                <p className="text-sm text-gray-400">Resend code in <span className="text-yellow-400 font-semibold">{countdownFormatted}</span></p>
              ) : (
                <button onClick={sendOTP} className="flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300 mx-auto"><RefreshCw size={13} /> Resend verification code</button>
              )}
            </div>
            <div className="text-center"><Link to="/login" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">Back to Login</Link></div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default OTPPage;
