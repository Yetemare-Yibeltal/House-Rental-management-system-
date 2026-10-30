import { useState } from 'react';
import { Mail, ArrowRight, Bell } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';
import GradientText from '../ui/GradientText';
import toast from 'react-hot-toast';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubscribed(true);
    toast.success('Successfully subscribed to NestFind alerts!');
    setLoading(false);
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal animation="scale">
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-3xl p-8 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold font-display text-white mb-2">
              Get <GradientText>New Listing</GradientText> Alerts
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Be the first to know when new properties matching your preferences are listed in Addis Ababa.
            </p>

            {subscribed ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-4 text-green-400 font-medium">
                ✅ You are subscribed! We'll notify you of new listings.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-surface-card border border-surface-border text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl hover:shadow-gold transition-all disabled:opacity-70">
                  {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <>Subscribe <ArrowRight size={14} /></>}
                </button>
              </form>
            )}
            <p className="text-xs text-gray-500 mt-3">No spam. Unsubscribe at any time.</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default NewsletterSection;
