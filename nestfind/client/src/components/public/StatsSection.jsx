import { useEffect, useState, useRef } from 'react';
import { Building2, Users, CheckCircle, Star } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';
import GradientText from '../ui/GradientText';

const useCountUp = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, start]);

  return count;
};

const StatItem = ({ icon: Icon, value, label, suffix = '', started }) => {
  const count = useCountUp(value, 2000, started);
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon size={24} className="text-yellow-400" />
      </div>
      <p className="text-3xl font-bold font-display">
        <GradientText>{count.toLocaleString()}{suffix}</GradientText>
      </p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
};

const StatsSection = () => {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { icon: Building2, value: 5000, label: 'Verified Properties', suffix: '+' },
    { icon: Users, value: 2000, label: 'Active Tenants', suffix: '+' },
    { icon: CheckCircle, value: 1000, label: 'Trusted Landlords', suffix: '+' },
    { icon: Star, value: 4, label: 'Average Rating', suffix: '.8★' },
  ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal animation="fadeUp">
          <div className="bg-surface-card border border-yellow-500/20 rounded-3xl p-10">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold font-display text-white">
                Trusted by Ethiopians Across <GradientText>Addis Ababa</GradientText>
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <StatItem key={stat.label} {...stat} started={started} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default StatsSection;
