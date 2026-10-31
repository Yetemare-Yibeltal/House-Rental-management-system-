import PublicLayout from '../../components/layout/PublicLayout';
import SEO from '../../components/common/SEO';
import GradientText from '../../components/ui/GradientText';

const LegalPage = ({ title, updated, intro, sections }) => (
  <PublicLayout>
    <SEO title={title} description={`${title} for NestFind`} />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="text-3xl font-bold font-display text-white mb-2"><GradientText>{title}</GradientText></h1>
      <p className="text-xs text-gray-500 mb-6">Last updated: {updated}</p>
      <p className="text-sm text-gray-300 leading-relaxed mb-8">{intro}</p>
      <div className="space-y-7">
        {sections.map(({ heading, body }, i) => (
          <section key={heading}>
            <h2 className="text-lg font-bold text-white font-display mb-2">{i + 1}. {heading}</h2>
            {body.map((p, j) => <p key={j} className="text-sm text-gray-400 leading-relaxed mb-2">{p}</p>)}
          </section>
        ))}
      </div>
      <div className="mt-10 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
        <p className="text-xs text-gray-400">This document is a template and must be reviewed by a qualified Ethiopian lawyer before NestFind goes live.</p>
      </div>
    </div>
  </PublicLayout>
);

export default LegalPage;
