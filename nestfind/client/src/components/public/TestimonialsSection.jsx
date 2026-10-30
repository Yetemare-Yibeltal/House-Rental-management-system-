import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { RatingDisplay } from '../ui/StarRating';
import Avatar from '../ui/Avatar';
import ScrollReveal from '../ui/ScrollReveal';
import GradientText from '../ui/GradientText';

const testimonials = [
  { id: 1, firstName: 'Mekdes', lastName: 'Alemu', role: 'Tenant', subCity: 'Bole', rating: 5, comment: 'NestFind found me a perfect 2-bedroom apartment in Bole within 3 days. The AI search understood exactly what I needed and the digital contract process was incredibly smooth.' },
  { id: 2, firstName: 'Yohannes', lastName: 'Tesfaye', role: 'Landlord', subCity: 'Kirkos', rating: 5, comment: 'I listed my properties on NestFind and found verified tenants within a week. The AI rent advisor helped me price correctly and I now earn 15% more than before.' },
  { id: 3, firstName: 'Hana', lastName: 'Girma', role: 'Tenant', subCity: 'Yeka', rating: 5, comment: 'The lease explainer AI feature is incredible! I finally understood every clause in my contract before signing. Highly recommend to all tenants.' },
  { id: 4, firstName: 'Dawit', lastName: 'Bekele', role: 'Landlord', subCity: 'Nifas Silk', rating: 4, comment: 'Managing 3 properties used to be stressful. NestFind made everything organized — rent tracking, maintenance requests, tenant communication all in one place.' },
];

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const t = testimonials[current];

  return (
    <section className="py-16 px-4 bg-surface-card/30">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal animation="fadeUp">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl font-bold font-display text-white mt-2">
              What Our <GradientText>Users Say</GradientText>
            </h2>
          </div>
        </ScrollReveal>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-surface-card border border-yellow-500/20 rounded-3xl p-8 sm:p-10"
            >
              <Quote size={32} className="text-yellow-500/30 mb-4" />
              <p className="text-gray-200 text-lg leading-relaxed mb-6 font-display italic">"{t.comment}"</p>
              <div className="flex items-center gap-4">
                <Avatar firstName={t.firstName} lastName={t.lastName} size="lg" />
                <div>
                  <p className="font-bold text-white">{t.firstName} {t.lastName}</p>
                  <p className="text-sm text-gray-400">{t.role} · {t.subCity}</p>
                  <RatingDisplay value={t.rating} size="sm" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="w-10 h-10 rounded-full border border-surface-border text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400 flex items-center justify-center transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`transition-all rounded-full ${i === current ? 'w-6 h-2 bg-yellow-400' : 'w-2 h-2 bg-gray-600 hover:bg-gray-400'}`} />
              ))}
            </div>
            <button onClick={next} className="w-10 h-10 rounded-full border border-surface-border text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400 flex items-center justify-center transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
