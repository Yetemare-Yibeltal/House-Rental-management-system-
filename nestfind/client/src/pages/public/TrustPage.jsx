import { Shield, CheckCircle, Lock, Eye, Bot, CreditCard, FileText } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import ScrollReveal from '../../components/ui/ScrollReveal';
import GradientText from '../../components/ui/GradientText';
import SEO from '../../components/common/SEO';

const TRUST_FEATURES = [
  {
    icon: Shield,
    title: 'KYC Verification',
    description: 'Every landlord on NestFind is identity verified using government-issued documents. We verify national ID, selfie, and proof of property ownership before any listing goes live.',
    details: ['Government ID verification', 'Selfie liveness check', 'Property ownership proof', 'Manual admin review'],
  },
  {
    icon: Bot,
    title: 'AI Fraud Detection',
    description: 'Our AI system analyzes every new property listing for fraud signals — suspicious pricing, stolen photos, fake addresses, and scam patterns common in Ethiopian rental markets.',
    details: ['Price consistency analysis', 'Description authenticity check', 'Contact info scanning', 'Pattern detection algorithms'],
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'All payments are processed through verified channels. We never store payment card data. Every transaction generates a tamper-proof receipt stored on your account.',
    details: ['Telebirr integration', 'CBE bank transfer', 'Encrypted transactions', 'Auto-generated receipts'],
  },
  {
    icon: FileText,
    title: 'Digital Contracts',
    description: 'Every rental agreement is signed digitally and stored securely. Our AI explains every clause in plain language before you sign. Contracts include verification hashes for authenticity.',
    details: ['Digital signatures', 'Blockchain-grade verification', 'AI clause explanation', 'Tamper-proof storage'],
  },
  {
    icon: Eye,
    title: 'Transparent Reviews',
    description: 'Only verified tenants with completed rentals can review landlords. Only verified landlords can review tenants. Every review is checked by our moderation system.',
    details: ['Verified-only reviews', 'AI moderation', 'No anonymous feedback', 'Response mechanism for landlords'],
  },
  {
    icon: CreditCard,
    title: 'Dispute Resolution',
    description: 'In the rare event of a payment dispute, our team investigates and mediates. Tenants can raise disputes within 7 days of payment. We resolve 95% of disputes within 48 hours.',
    details: ['7-day dispute window', '48-hour resolution target', 'Human mediation team', 'Full transaction records'],
  },
];

const TrustPage = () => {
  return (
    <PublicLayout>
      <SEO title="Trust & Safety" description="How NestFind protects tenants and landlords in Ethiopia with AI fraud detection, KYC verification, and secure payments." />

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-surface-card to-dark" />
        <div className="relative max-w-3xl mx-auto">
          <ScrollReveal animation="fadeUp">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
              <Shield size={30} className="text-green-400" />
            </div>
            <h1 className="text-4xl font-bold font-display text-white mb-4">
              Trust & <GradientText>Safety</GradientText>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              NestFind is built on the foundation of trust. Here is everything we do to protect every user on our platform.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {TRUST_FEATURES.map(({ icon: Icon, title, description, details }, i) => (
            <ScrollReveal key={title} animation="fadeUp" delay={i * 0.08}>
              <div className="bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={24} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white font-display mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">{description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {details.map((detail) => (
                      <div key={detail} className="flex items-center gap-1.5 text-xs text-gray-300">
                        <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Report Section */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="scale">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white font-display mb-2">Report a Problem</h3>
              <p className="text-gray-400 text-sm mb-5">
                Spotted a suspicious listing, experienced fraud, or have a safety concern? Report it immediately and our team will investigate within 24 hours.
              </p>
              
              <a
                href="mailto:safety@nestfind.et"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl hover:shadow-gold transition-all"
              >
                <Shield size={16} />
                Report Safety Issue
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicLayout>
  );
};

export default TrustPage;

