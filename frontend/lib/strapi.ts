import axios from 'axios';
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://api.2cscomplexes.com';
const strapi = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
});
export default strapi;
// Helper to populate image URLs properly
export const getStrapiMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${strapiUrl}${url}`;
};
