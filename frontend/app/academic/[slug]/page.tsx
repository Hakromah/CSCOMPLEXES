import AcademicDetail from '@/app/pages-sections/academic/AcademicDetail';
import { programsData, programSlugs } from '@/data/academicPrograms';
import {
    fetchAcademicProgramBySlug,
    fetchAcademicProgramSlugs,
} from '@/lib/strapi-api';
import type { AcademicProgram } from '@/types/strapi';

// Allow slugs NOT in generateStaticParams (e.g. new entries added in Strapi)
export const dynamicParams = true;

// ── Static params: try Strapi first, fall back to hardcoded slugs ─────────────
export async function generateStaticParams() {
    try {
        const strapiSlugs = await fetchAcademicProgramSlugs();
        if (strapiSlugs.length > 0) {
            return strapiSlugs.map((slug: string) => ({ slug }));
        }
    } catch {
        // Strapi unreachable at build time — use hardcoded fallback
    }
    return programSlugs.map((slug: string) => ({ slug }));
}

// ── Helper: build a full AcademicProgram from the hardcoded data file ─────────
type ProgramEntry = {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    contentImage: string;
    highlights: string[];
    curriculum: { subject: string; desc: string }[];
};

function hardcodedProgram(slug: string): AcademicProgram {
    const data: ProgramEntry | undefined = programsData[slug];
    const base: ProgramEntry = data ?? {
        title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        subtitle: 'Empowering Students for the Future',
        description:
            'Prepare for higher education and career success with our rigorous academic programs. We provide an environment that fosters intellectual growth and personal development.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Comprehensive curriculum aligned with standards',
            'Experienced and dedicated faculty',
            'State-of-the-art facilities and resources',
            'Holistic approach to student development',
        ],
        curriculum: [
            { subject: 'Core Framework', desc: 'Advanced studies in mathematics, sciences, language arts, and humanities.' },
            { subject: 'Specialized Electives', desc: 'Diverse options including technology, arts, vocational skills, and physical education.' },
            { subject: 'Enrichment Programs', desc: 'Clubs, competitive sports, innovation labs, and leadership development.' },
            { subject: 'Future Readiness', desc: 'Career exploration, counseling, and preparation for higher education.' },
        ],
    };

    return {
        id: 0,
        title: base.title,
        slug,
        category: '',
        subtitle: base.subtitle,
        description: base.description,
        image: base.image,
        contentImage: base.contentImage,
        sortOrder: 0,
        header: base.title,
        subheader: base.subtitle,
        highlights: base.highlights,
        description_text: '',
        middle_text: '',
        mid_header: '',
        academic_link: null,
        curriculum: base.curriculum,
        breadcrumb_item: [],
        prospectusFileUrl: '',
        statValue1: 'Captivant',
        statLabel1: 'Programme',
        statValue2: 'Experts',
        statLabel2: 'Éducateurs',
        statValue3: 'Modernes',
        statLabel3: 'Infrastructures',
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Prefer Strapi data; fall back to the hardcoded data file
    let program: AcademicProgram;
    try {
        const strapiProgram = await fetchAcademicProgramBySlug(slug);
        program = strapiProgram ?? hardcodedProgram(slug);
    } catch {
        program = hardcodedProgram(slug);
    }

    return <AcademicDetail program={program} />;
}
