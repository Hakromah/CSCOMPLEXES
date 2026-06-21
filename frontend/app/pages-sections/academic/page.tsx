"use client"
import React, { useState, useEffect, useRef } from 'react';
import StrapiImage from '@/components/StrapiImage';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import type { AcademicSection, AcademicResource, SchoolCalendar } from '@/types/strapi';

const fallbackSections: AcademicSection[] = [
    {
        id: 1, sectionId: 'elementary', title: 'École primaire',
        content: 'Accent sur l\'alphabétisation, les mathématiques et le développement socio-émotionnel grâce à un apprentissage par l\'investigation.',
        image: '/home/classmate.jpg',
        details: ["Approche d'apprentissage par l'investigation", "Forte concentration sur l'alphabétisation et le calcul", "Environnement sûr et bienveillant"],
        header: "École primaire",
        subheader: "Accent sur l'alphabétisation, les mathématiques et le développement socio-émotionnel grâce à un apprentissage par l'investigation.",
        breadcrumb_item: []
    },
    {
        id: 2, sectionId: 'junior', title: 'Collège',
        content: 'Introduction à des matières spécialisées, aux sciences en laboratoire et aux compétences organisationnelles pour l\'autonomie.',
        image: '/home/intro2.png',
        details: ["Enseignants spécialisés par matière", "Introduction aux sciences en laboratoire", "Développement des compétences organisationnelles"],
        header: "Collège",
        subheader: "Introduction à des matières spécialisées, aux sciences en laboratoire et aux compétences organisationnelles pour l'autonomie.",
        breadcrumb_item: []
    },
    {
        id: 3, sectionId: 'highschool', title: 'Lycée',
        content: 'Cours avancés, parcours d\'excellence et programmes de préparation à l\'université et à la vie active.',
        image: '/home/am1.png',
        details: ["Cours avancés (AP)", "Programmes de préparation à l'université et à la vie active", "Opportunités de leadership"],
        header: "Lycée",
        subheader: "Cours avancés, parcours d'excellence et programmes de préparation à l'université et à la vie active.",
        breadcrumb_item: []
    },
];

interface AcademicPageProps {
    sections?: AcademicSection[];
    resources?: AcademicResource[];
    calendars?: SchoolCalendar[];
}

export default function AcademicPage({ sections: sectionsProp, resources: resourcesProp, calendars: calendarsProp }: AcademicPageProps) {
    const raw = (sectionsProp && sectionsProp.length > 0) ? sectionsProp : fallbackSections;
    // Sort by sort_order ascending (nulls last), then by id as tiebreaker

    const academicSections = [...raw].sort((a, b) => {
        const aOrder = (a as AcademicSection & { sort_order?: number | null }).sort_order ?? Infinity;
        const bOrder = (b as AcademicSection & { sort_order?: number | null }).sort_order ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.id - b.id;
    });


    const academicBreadcrumb = academicSections.find(s => s.breadcrumb_item && s.breadcrumb_item.length > 0);
    const breadcrumbData = academicBreadcrumb?.breadcrumb_item?.[0];

    // Extract Breadcrumb from the first sorted section

    const [activeSection, setActiveSection] = useState<string>(academicSections[0].sectionId);
    const observerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0.5
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Key refs by section.id (always unique) not sectionId which may be null
        Object.values(observerRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
        // Re-register observer when sections change
    }, [academicSections]);

    const activeImage = academicSections.find(s => String(s.id) === activeSection)?.image || academicSections[0].image;
    const activeData = academicSections.find(s => String(s.id) === activeSection) || academicSections[0];

    return (
        <div className="w-full min-h-screen bg-background">
            <Breadcrumb
                title={breadcrumbData?.breadcrumb_title || "Excellence académique"}
                description={breadcrumbData?.description || "Donner aux étudiants les moyens de réussir grâce à une éducation complète et des approches d'apprentissage innovantes"}
                image={breadcrumbData?.imageUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"}
                alt={breadcrumbData?.breadcrumb_title || "Excellence académique"}
            />

            <section className="py-[clamp(25px,3vw,80px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

                    {/* Intro */}
                    <div className="max-w-4xl mb-[clamp(20px,4vw,50px)]">
                        <div className="flex items-center gap-4 mb-[clamp(12px,3vw,25px)]">
                            <div className="h-12 w-1 bg-[#394995]"></div>
                            <h2 className="text-xl md:text-4xl font-bold text-gray-900">Excellence académique</h2>
                        </div>
                        <h3 className="text-md md:text-xl font-semibold mb-4 max-sm:mb-2">
                            {activeData.header || 'Donner aux étudiants les moyens de réussir grâce à une éducation complète et des approches d\'apprentissage innovantes'}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            {activeData.subheader || 'Notre programme est conçu pour répondre aux normes éducatives nationales et aux meilleures pratiques mondiales. Nous mettons en relation les étudiants exceptionnels avec des opportunités de bourses locales et internationales. Les étudiants reçoivent un mentorat et des conseils pour les aider à choisir leurs futures carrières et parcours universitaires.'}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-[clamp(20px,3.5vw,50px)] relative">
                        {/* Left Column: Scrollable Content */}
                        <div className="w-full lg:w-1/2 space-y-[clamp(30px,3vw,60px)]">
                            <h2 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-[clamp(10px,3vw,26px)] border-b pb-4 max-sm:text-[20px] inline-block">Parcours d'apprentissage</h2>

                            {academicSections.map((section) => (
                                <div
                                    key={String(section.id)}
                                    id={String(section.id)}
                                    ref={el => { if (el) observerRefs.current[String(section.id)] = el; }}
                                    className="scroll-mt-32 h-fit flex flex-col justify-center"
                                >
                                    <div className="border-l-4 border-[#394995] pl-6 py-2 transition-all duration-300">
                                        <h3 className={`text-[clamp(20px,3vw,32px)] font-bold mb-3 ${activeSection === String(section.id) ? 'text-[#394995]' : 'text-gray-900'}`}>
                                            {section.header || section.title}
                                        </h3>
                                        <p className="text-gray-600 text-lg mb-[clamp(15px,3vw,24px)] leading-relaxed">
                                            {section.subheader || section.content}
                                        </p>
                                        <ul className="space-y-3">
                                            {section.details.map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-700">
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column: Sticky Image */}
                        <div className="hidden md:block w-1/2 relative">
                            <div className="sticky top-32 h-[400px] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out">
                                <StrapiImage
                                    src={activeImage}
                                    alt="Academic Level"
                                    fill
                                    className="object-cover transition-opacity duration-500"
                                    unoptimized
                                />
                                {/* Optional Overlay/Decoration resembling the book stack in the user request */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Calendar Section */}
            <section className="sm:py-[clamp(20px,3vw,50px)] max-sm:pt-5 bg-gray-50">
                <div className="container max-w-[1920px]] mx-auto px-5 md:px-[clamp(20px,5vw,60px)]">
                    {calendarsProp && calendarsProp.length > 0 ? (
                        calendarsProp.map((cal) => (
                            <a key={cal.id} href={cal.fileUrl || '#'} target="_blank" download rel="noopener noreferrer" className='block w-full h-full mb-4 last:mb-0'>
                                <div className="bg-white p-[clamp(12px,4vw,26px)] rounded-xl md:shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-blue-50 p-4 rounded-lg text-[#394995] font-bold text-xl max-md:text-sm">
                                            {cal.year}
                                        </div>
                                        <h3 className="text-xl max-md:text-sm font-bold text-gray-900">{cal.label}</h3>
                                    </div>
                                    <Button variant="outline" className="gap-2 max-xs:w-full cursor-pointer border-gray-300 hover:border-[#394995] hover:text-[#394995]">
                                        Télécharger <FileText className="w-4 h-4" />
                                    </Button>
                                </div>
                            </a>
                        ))
                    ) : (
                        <a href="#" className='block w-full h-full'>
                            <div className="bg-white p-[clamp(12px,4vw,26px)] rounded-xl md:shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="bg-blue-50 p-4 rounded-lg text-[#394995] font-bold text-xl max-md:text-sm">
                                        —
                                    </div>
                                    <h3 className="text-xl max-md:text-sm font-bold text-gray-900">Calendrier scolaire</h3>
                                </div>
                                <Button variant="outline" className="gap-2 max-xs:w-full cursor-pointer border-gray-300 hover:border-[#394995] hover:text-[#394995]">
                                    Télécharger <FileText className="w-4 h-4" />
                                </Button>
                            </div>
                        </a>
                    )}
                </div>
            </section>

            {/* Resources Section */}
            <section className="py-[clamp(20px,3vw,80px)] bg-gray-50">
                <div className="container mx-auto px-5 max-w-[1920px] md:px-[clamp(20px,5vw,60px)]">
                    <div className="bg-[#f0f4f8] p-[clamp(12px,4vw,40px)] rounded-[clamp(12px,4vw,30px)]">
                        <h2 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-[clamp(10px,3vw,26px)] border-b pb-4 max-sm:text-[20px]">Ressources académiques utiles</h2>
                        <div className="space-y-1">
                            {resourcesProp && resourcesProp.length > 0 ? (
                                resourcesProp.map((resource) => (
                                    <div key={resource.id} className='w-full h-full relative'>
                                        <a
                                            href={resource.fileUrl || '#'}
                                            download
                                            target="_blank"
                                            rel='noopener noreferrer'
                                            className='block w-full h-full'
                                        >
                                            <div className="flex items-center justify-between py-[clamp(12px,3vw,24px)] border-b border-gray-200 last:border-0 hover:bg-white/50 px-4 rounded-lg max-md:rounded-sm transition-colors cursor-pointer group">
                                                <span className="text-gray-700 font-medium">{resource.name}</span>
                                                <div className="flex items-center gap-2 text-[#394995] opacity-70 max-md:opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-sm font-semibold">Télécharger</span>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 py-4 px-4">Aucune ressource disponible pour le moment.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
