import OpportunityDetail from '@/app/pages-sections/opportunity/OpportunityDetail';
import { fetchOpportunityBySlug } from '@/lib/strapi-api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
// 1. Ensure 'id' matches the folder name [id]
// 2. In Next.js 15, params is a Promise, so we await it correctly
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id; 

    // Debugging: Log this to your terminal to see if the ID is coming through
    console.log("Fetching opportunity with ID/Slug:", id);

    const opportunity = await fetchOpportunityBySlug(id);

    if (!opportunity) {
        return notFound();
    }

    return <OpportunityDetail opportunity={opportunity} />;
}
