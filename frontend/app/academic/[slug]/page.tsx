
import AcademicDetail from '@/app/pages-sections/academic/AcademicDetail';
import { programsData, programSlugs } from '@/data/academicPrograms';

export async function generateStaticParams() {
    return programSlugs.map((slug: string) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = programsData[slug];

    // Fallback if not specifically defined in programsData yet
    const program = data || {
        title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        subtitle: 'Empowering Students for the Future',
        description: 'Prepare for higher education and career success with our rigorous academic programs. We provide an environment that fosters intellectual growth and personal development. Our dedicated faculty ensures every student reaches their full potential.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Comprehensive curriculum aligned with standards',
            'Experienced and dedicated faculty',
            'State-of-the-art facilities and resources',
            'Holistic approach to student development'
        ],
        curriculum: [
            { subject: 'Core Framework', desc: 'Advanced studies in mathematics, sciences, language arts, and humanities.' },
            { subject: 'Specialized Electives', desc: 'Diverse options including technology, arts, vocational skills, and physical education.' },
            { subject: 'Enrichment Programs', desc: 'Clubs, competitive sports, innovation labs, and leadership development.' },
            { subject: 'Future Readiness', desc: 'Career exploration, counseling, and preparation for higher education.' }
        ]
    };

    return <AcademicDetail program={program} />;
}
