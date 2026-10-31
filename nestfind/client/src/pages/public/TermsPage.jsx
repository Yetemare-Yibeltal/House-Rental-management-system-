import LegalPage from './LegalPage';

const sections = [
  { heading: 'About NestFind', body: [
    'NestFind is a marketplace and management tool connecting landlords and tenants. NestFind is not a party to any lease between a landlord and a tenant.',
  ]},
  { heading: 'Accounts and verification', body: [
    'You must provide accurate information. Landlords must complete identity verification before listings go live. You are responsible for activity under your account.',
  ]},
  { heading: 'Listings', body: [
    'Landlords warrant they own or are authorised to rent each property, and that listings are accurate. We may remove listings that are false, misleading, or flagged as fraudulent.',
  ]},
  { heading: 'Bookings, contracts and payments', body: [
    'Visit requests are not a commitment to rent. A lease is formed only when both parties sign a contract on the platform. Payments recorded on NestFind are between tenant and landlord; the platform may deduct a service fee shown at payment time.',
  ]},
  { heading: 'Maintenance and disputes', body: [
    'Tenants should report issues through the platform. Payment disputes may be raised within the dispute window shown in the app. NestFind may mediate but does not guarantee outcomes.',
  ]},
  { heading: 'Prohibited conduct', body: [
    'Fraud, fake listings, harassment, discrimination, circumventing platform fees, and unlawful use are prohibited and may lead to suspension.',
  ]},
  { heading: 'AI-generated content', body: [
    'AI explanations of leases, prices, and diagnoses are informational only and are not legal, financial, or professional advice.',
  ]},
  { heading: 'Liability and changes', body: [
    'The service is provided as is to the extent permitted by law. We may update these terms and will notify you of material changes. Governing law: the laws of the Federal Democratic Republic of Ethiopia.',
  ]},
];

const TermsPage = () => (
  <LegalPage title="Terms of Service" updated="1 November 2026" intro="By using NestFind you agree to these terms." sections={sections} />
);

export default TermsPage;
