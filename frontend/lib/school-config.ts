// School-specific configuration for 2CS COMPLEXE SCOLAIRE
// Used for PDF branding, verification URLs, and school identity

export const SCHOOL_CONFIG = {
  name: '2CS COMPLEXE SCOLAIRE',
  subtitle: 'Camara Salematou',
  address: 'Conakry, Guinea',
  contact: 'accounts@2cscomplexes.com',
  verifyUrl: 'https://2cscomplexes.com/verify',
  logoPath: '/logo/2cslogo.jpeg',          // from /public/logo/
  logoJpeg: true,                           // JPEG format
  primaryColor: [15, 23, 42] as [number, number, number],   // dark navy
  accentColor: [37, 99, 235] as [number, number, number],   // blue-600
} as const;
