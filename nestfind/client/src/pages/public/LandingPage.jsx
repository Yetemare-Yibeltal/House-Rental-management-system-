// nestfind/nestfind/client/src/pages/public/LandingPage.jsx

import PublicLayout from '../../components/layout/PublicLayout';
import HeroSection from '../../components/public/HeroSection';
import StatsSection from '../../components/public/StatsSection';
import FeaturedProperties from '../../components/public/FeaturedProperties';
import HowItWorks from '../../components/public/HowItWorks';
import TestimonialsSection from '../../components/public/TestimonialsSection';
import NewsletterSection from '../../components/public/NewsletterSection';
import SEO from '../../components/common/SEO';

const LandingPage = () => {
  return (
    <PublicLayout>
      <SEO
        title="NestFind — AI-Powered House Rental Ethiopia"
        description="Find verified rental properties in Addis Ababa with AI-powered search. Digital contracts, secure payments, and maintenance tracking."
        keywords="house rental Ethiopia, Addis Ababa apartment, rental property, NestFind"
      />
      <HeroSection />
      <StatsSection />
      <FeaturedProperties />
      <HowItWorks />
      <TestimonialsSection />
      <NewsletterSection />
    </PublicLayout>
  );
};

export default LandingPage;