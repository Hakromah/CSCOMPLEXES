import { MetadataRoute } from 'next';
import { fetchBlogPosts, fetchAcademicPrograms, fetchOpportunities } from '@/lib/strapi-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://2cscomplexes.com';

  // 1. Static routes
  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/academic`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/opportunities`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/legal`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/programs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/staff`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // 2. Fetch blog posts dynamically
  try {
     const { posts } = await fetchBlogPosts({ pageSize: 100 });
     if (posts && Array.isArray(posts)) {
        posts.forEach(post => {
           if (post.slug) {
              routes.push({
                 url: `${baseUrl}/blog/${post.slug}`,
                 lastModified: new Date(post.date || new Date()),
                 changeFrequency: 'weekly',
                 priority: 0.6,
              });
           }
        });
     }
  } catch (error) {
     console.error('Failed to fetch blog posts for sitemap:', error);
  }

  // 3. Fetch academic programs dynamically
  try {
     const programs = await fetchAcademicPrograms();
     if (programs && Array.isArray(programs)) {
        programs.forEach(prog => {
           if (prog.slug) {
              routes.push({
                 url: `${baseUrl}/academic/${prog.slug}`,
                 lastModified: new Date(),
                 changeFrequency: 'monthly',
                 priority: 0.7,
              });
           }
        });
     }
  } catch (error) {
     console.error('Failed to fetch academic programs for sitemap:', error);
  }

  // 4. Fetch opportunities dynamically
  try {
     const opportunities = await fetchOpportunities();
     if (opportunities && Array.isArray(opportunities)) {
        opportunities.forEach(opp => {
           const slug = opp.slug || String(opp.id);
           if (slug) {
              routes.push({
                 url: `${baseUrl}/opportunities/${slug}`,
                 lastModified: new Date(),
                 changeFrequency: 'monthly',
                 priority: 0.6,
              });
           }
        });
     }
  } catch (error) {
     console.error('Failed to fetch opportunities for sitemap:', error);
  }

  return routes;
}
