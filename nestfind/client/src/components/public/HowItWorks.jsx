import { Search, CalendarCheck, FileText, Home } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';
import GradientText from '../ui/GradientText';

const steps = [
  { icon: Search, step: '01', title: 'Search with AI', description: 'Describe your dream home in natural language. Our AI understands "2 bedroom near Bole under 25k" instantly.' },
  { icon: CalendarCheck, step: '02', title: 'Book a Visit', description: 'Schedule property visits directly with verified landlords. Get confirmed appointments within 24 hours.' },
  { icon: FileText, step: '03', title: 'Sign Digitally', description: 'Review AI-explained lease contracts and sign digitally. No printing, no hassle.' },
  { icon: Home, step: '04', title: 'Move In & Pay', description: 'Pay rent securely via Telebirr, CBE, or bank transfer. Track everything from your dashboard.' },
];

const HowItWorks = () => (
  <section className="py-16 px-4 bg-surface-card/30">
    <div className="max-w-7xl mx-auto">
      <ScrollReveal animation="fadeUp">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Simple Process</span>
          <h2 className="text-3xl font-bold font-display text-white mt-2">
            How <GradientText>NestFind</GradientText> Works
          </h2>
          <p className="text-gray-400 text-sm mt-3 max-w-xl mx-auto">
            From search to move-in, we make renting in Ethiopia simple, transparent, and secure.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map(({ icon: Icon, step, title, description }, i) => (
          <ScrollReveal key={step} animation="fadeUp" delay={i * 0.1}>
            <div className="relative text-center p-6 bg-surface-card border border-surface-border rounded-2xl hover:border-yellow-500/30 transition-all group">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-500/60 bg-dark px-2">{step}</span>
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-500/20 transition-colors">
                <Icon size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
