import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import propertyApi from '../../api/propertyApi';
import PropertyCard from '../property/PropertyCard';
import { PropertyCardSkeleton } from '../ui/Skeleton';
import ScrollReveal from '../ui/ScrollReveal';
import GradientText from '../ui/GradientText';

const FeaturedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await propertyApi.getFeatured(8);
        setProperties(response.data.data?.properties || response.data.data || []);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal animation="fadeUp">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Featured Properties</span>
              </div>
              <h2 className="text-3xl font-bold font-display text-white">
                Handpicked <GradientText>Premium Listings</GradientText>
              </h2>
              <p className="text-gray-400 text-sm mt-2">Verified properties selected by our team for quality and value</p>
            </div>
            <Link to="/listings?isFeatured=true" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors">
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : properties.map((property, i) => (
                <ScrollReveal key={property._id} animation="fadeUp" delay={i * 0.05}>
                  <PropertyCard property={property} />
                </ScrollReveal>
              ))}
        </div>

        {!loading && properties.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-10">No featured properties yet.</p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProperties;
