import LegalPage from './LegalPage';

const sections = [
  { heading: 'Information we collect', body: [
    'Account data: name, email, phone number, role, and password (stored only as a salted hash).',
    'Verification data: national ID or passport details and images you upload for KYC.',
    'Rental data: bookings, contracts, payments, maintenance requests, messages, and reviews.',
    'Technical data: IP address, device and browser type, and usage logs used for security and fraud prevention.',
  ]},
  { heading: 'How we use your information', body: [
    'To operate the platform, verify identities, process rental activity, and send service notifications.',
    'To detect fraud and abuse, including automated analysis of listings.',
    'To improve the service. We do not sell your personal data.',
  ]},
  { heading: 'AI features', body: [
    'Some features (search, recommendations, lease explanations, maintenance diagnosis) send relevant text to an AI provider to generate a response. Do not include sensitive personal data you do not want processed this way.',
  ]},
  { heading: 'Sharing', body: [
    'Landlords see tenant details needed to manage a booking or rental. Tenants see landlord details needed to rent. We share data with service providers (hosting, email, image storage, payments) only as needed, and with authorities when legally required.',
  ]},
  { heading: 'Retention and security', body: [
    'We keep data while your account is active and as required by law for financial and contract records. Data is encrypted in transit, and access is restricted and logged.',
  ]},
  { heading: 'Your rights', body: [
    'You can access, correct, or request deletion of your data by contacting support@nestfind.et. Some records (contracts, payments) may need to be retained by law.',
  ]},
  { heading: 'Contact', body: ['support@nestfind.et — Bole, Addis Ababa, Ethiopia.'] },
];

const PrivacyPage = () => (
  <LegalPage title="Privacy Policy" updated="1 November 2026" intro="This policy explains what personal data NestFind collects, why, and the choices you have." sections={sections} />
);

export default PrivacyPage;
