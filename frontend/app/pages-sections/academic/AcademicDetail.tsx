"use client";

import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, Users, Trophy, Download, GraduationCap } from 'lucide-react';
import type { AcademicProgram } from '@/types/strapi';

// Default fallback images in case Strapi has no image set
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80';
const FALLBACK_CONTENT = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

export default function AcademicDetail({ program }: { program: AcademicProgram }) {

    // Breadcrumb
    const bc = program.breadcrumb_item?.[0];
    const breadcrumbTitle = bc?.breadcrumb_title || program.title;
    const breadcrumbDesc = bc?.description || program.subtitle || 'Empowering Students for the Future';
    const breadcrumbImage = bc?.imageUrl || program.image || FALLBACK_HERO;

    // Academic links for CTA buttons
    const academicLinks = program.academic_link ?? [];
    const academicLink0 = academicLinks[0];
    const academicLink1 = academicLinks[1];

    // Images
    const contentImage = program.contentImage || program.image || FALLBACK_CONTENT;

    // Highlights
    const highlights: string[] = program.highlights?.length
        ? program.highlights
        : [
            'Programme complet align sur les normes',
            'Corps enseignant experimente et dedie',
            'Installations et ressources modernes',
            'Approche holistique du developpement des eleves',
        ];

    // Curriculum
    const curriculum: { subject: string; desc: string }[] = program.curriculum?.length
        ? program.curriculum
        : [
            { subject: 'Cadre fondamental', desc: 'Etudes avancees en mathematiques, sciences, arts du langage et sciences humaines.' },
            { subject: 'Options specialisees', desc: 'Options variees incluant technologie, arts, competences professionnelles et education physique.' },
            { subject: 'Programmes enrichissants', desc: 'Clubs, sports de competition, laboratoires d innovation et developpement du leadership.' },
            { subject: 'Preparation a l avenir', desc: 'Exploration de carrieres, orientation et preparation a l enseignement superieur.' },
        ];

    // Stats
    const stat1 = { value: program.statValue1 || 'Captivant', label: program.statLabel1 || 'Programme' };
    const stat2 = { value: program.statValue2 || 'Experts', label: program.statLabel2 || 'Educateurs' };
    const stat3 = { value: program.statValue3 || 'Modernes', label: program.statLabel3 || 'Infrastructures' };

    // PDF
    const prospectusUrl = program.prospectusFileUrl || null;

    return (
        <div className="w-full min-h-screen bg-background mb-5">
            <Breadcrumb
                title={breadcrumbTitle}
                description={breadcrumbDesc}
                image={breadcrumbImage}
                alt={`${breadcrumbTitle} Banner`}
            />

            {/* Programme Overview */}
            <div className="max-sm:pt-7 max-sm:pb-2.5 sm:py-[clamp(20px,5vw,100px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                    <div className="grid lg:grid-cols-2 gap-[clamp(20px,4vw,60px)] items-center">

                        {/* Left: text */}
                        <div className="space-y-[clamp(15px,5vw,24px)]">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                <GraduationCap className="w-5 h-5" />
                                {program.mid_header && <span>{program.mid_header}</span>}
                            </div>
                            <h1 className="text-[clamp(22px,4vw,45px)] font-bold text-gray-900 leading-tight">
                                {program.title}
                            </h1>
                            {program.subtitle && (
                                <p className="text-primary font-medium text-lg">{program.subtitle}</p>
                            )}
                            <p className="text-gray-600 text-[clamp(16px,1.5vw,18px)] leading-relaxed">
                                {program.description}
                            </p>

                            {/* Highlights */}
                            <div className="pt-[clamp(5px,5vw,24px)]">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Points cles</h3>
                                <ul className="grid sm:grid-cols-2 gap-4">
                                    {highlights.map((highlight, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                                            <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                            <span className="leading-snug">{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA buttons — name and href come from Strapi academic_link */}
                            <div className="pt-8 flex flex-wrap gap-4">
                                {academicLink0 && (
                                    <a href={academicLink0.href} target="_blank" rel="noreferrer">
                                        <Button className="h-fit px-[clamp(25px,3vw,36px)] py-[clamp(10px,3vw,15px)] rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1">
                                            {academicLink0.name}
                                        </Button>
                                    </a>
                                )}
                                {academicLink1 && (
                                    <a href={academicLink1.href} target="_blank" rel="noreferrer">
                                        <Button
                                            variant="outline"
                                            className="h-fit px-[clamp(25px,3vw,36px)] py-[clamp(10px,3vw,15px)] rounded-full border-gray-300 text-gray-700 hover:border-primary hover:text-primary font-bold text-lg transition-all duration-300"
                                        >
                                            {academicLink1.name}
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Right: image with stat overlay */}
                        <div className="relative h-[clamp(400px,40vw,600px)] w-full rounded-3xl overflow-hidden shadow-2xl group">
                            <Image
                                src={contentImage}
                                alt={`${program.title} apercu`}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-transparent" />

                            {/* Stat overlay */}
                            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="flex justify-around items-center divide-x divide-gray-200">
                                    <div className="text-center px-4">
                                        <div className="text-primary font-bold text-2xl mb-1">{stat1.value}</div>
                                        <div className="text-gray-500 text-sm font-medium">{stat1.label}</div>
                                    </div>
                                    <div className="text-center px-4">
                                        <div className="text-primary font-bold text-2xl mb-1">{stat2.value}</div>
                                        <div className="text-gray-500 text-sm font-medium">{stat2.label}</div>
                                    </div>
                                    <div className="text-center px-4">
                                        <div className="text-primary font-bold text-2xl mb-1">{stat3.value}</div>
                                        <div className="text-gray-500 text-sm font-medium">{stat3.label}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Curriculum Breakdown */}
            <div className="max-sm:pt-7 max-sm:pb-2.5 sm:py-[clamp(20px,5vw,100px)] bg-gray-50">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                    <div className="text-center max-w-3xl mx-auto mb-[clamp(20px,3vw,60px)]">
                        <h2 className="text-[clamp(22px,4vw,45px)] font-bold text-gray-900 mb-6">{program.middle_text}</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            {program.description_text}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {curriculum.map((item, i) => {
                            const icons = [BookOpen, Users, Trophy, GraduationCap];
                            const Icon = icons[i % icons.length];
                            return (
                                <div
                                    key={i}
                                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group hover:-translate-y-1"
                                >
                                    <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                        {item.subject}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Prospectus Download CTA */}
            {/* Always visible, button disabled when no file in Strapi */}
            <div className="max-sm:pt-7 max-sm:pb-5 sm:py-[clamp(20px,5vw,80px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                    <div className="bg-[#394995] text-white rounded-3xl p-[clamp(24px,4vw,48px)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-[clamp(15px,3vw,35px)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl pointer-events-none" />

                        <div className="relative z-10 lg:max-w-2xl text-center md:text-left">
                            <h2 className="text-[clamp(20px,3vw,36px)] font-bold mb-4">
                                Telecharger le Prospectus — {program.title}
                            </h2>
                            <p className="text-white/80 text-lg">
                                Obtenez un apercu detaille de notre curriculum, des activites parascolaires et du processus d&apos;admission dans notre guide complet.
                            </p>
                        </div>

                        <div className="relative z-10 shrink-0">
                            {prospectusUrl ? (
                                <a href={prospectusUrl} download target="_blank" rel="noreferrer">
                                    <Button className="h-fit py-[clamp(10px,3vw,15px)] px-[clamp(20px,3vw,40px)] rounded-full bg-white text-primary hover:bg-gray-100 font-bold text-sm md:text-lg transition-all duration-300 flex items-center gap-3 group">
                                        <Download className="w-5 h-5 lg:group-hover:-translate-y-1 transition-transform" />
                                        Telecharger PDF
                                    </Button>
                                </a>
                            ) : (
                                <Button
                                    disabled
                                    className="h-fit py-[clamp(10px,3vw,15px)] px-[clamp(20px,3vw,40px)] rounded-full bg-white/50 text-primary/50 font-bold text-sm md:text-lg cursor-not-allowed flex items-center gap-3"
                                    title="Prospectus non disponible pour le moment"
                                >
                                    <Download className="w-5 h-5" />
                                    Bientot disponible
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
