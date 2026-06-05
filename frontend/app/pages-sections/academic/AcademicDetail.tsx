"use client";

import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, Users, Trophy, Download, GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CurriculumItem {
    subject: string;
    desc: string;
}

interface ProgramData {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    contentImage: string;
    highlights: string[];
    curriculum: CurriculumItem[];
}

export default function AcademicDetail({ program }: { program: ProgramData }) {
    return (
        <div className="w-full min-h-screen bg-background">
            <Breadcrumb
                title={program.title}
                description={program.subtitle}
                image={program.image}
                alt={`${program.title} Banner`}
            />

            <div className="max-sm:pt-7 max-sm:pb-2.5 sm:py-[clamp(20px,5vw,100px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                    <div className="grid lg:grid-cols-2 gap-[clamp(20px,4vw,60px)] items-center">
                        <div className="space-y-[clamp(15px,5vw,24px)]">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                <GraduationCap className="w-5 h-5" />
                                <span>Academic Program</span>
                            </div>
                            <h2 className="text-[clamp(22px,4vw,45px)] font-bold text-gray-900 leading-tight">
                                Program Overview
                            </h2>
                            <p className="text-gray-600 text-[clamp(16px,1.5vw,18px)] leading-relaxed">
                                {program.description}
                            </p>

                            <div className="pt-[clamp(5px,5vw,24px)]">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Key Highlights</h3>
                                <ul className="grid sm:grid-cols-2 gap-4">
                                    {program.highlights.map((highlight, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                                            <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                            <span className="leading-snug">{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-8 flex flex-wrap gap-4">
                                <Button className="h-fit px-[clamp(25px,3vw,36px)] py-[clamp(10px,3vw,15px)] rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1">
                                    Apply for Admission
                                </Button>
                                <Button variant="outline" className="h-fit px-[clamp(25px,3vw,36px)] py-[clamp(10px,3vw,15px)] rounded-full border-gray-300 text-gray-700 hover:border-primary hover:text-primary font-bold text-lg transition-all duration-300">
                                    Contact Admissions
                                </Button>
                            </div>
                        </div>

                        <div className="relative h-[clamp(400px,40vw,600px)] w-full rounded-3xl overflow-hidden shadow-2xl group">
                            <Image
                                src={program.contentImage}
                                alt={`${program.title} Overview`}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-transparent" />

                            {/* Decorative stats card overlay */}
                            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="flex justify-around items-center divide-x divide-gray-200">
                                    <div className="text-center px-4">
                                        <div className="text-primary font-bold text-2xl mb-1">Engaging</div>
                                        <div className="text-gray-500 text-sm font-medium">Curriculum</div>
                                    </div>
                                    <div className="text-center px-4">
                                        <div className="text-primary font-bold text-2xl mb-1">Expert</div>
                                        <div className="text-gray-500 text-sm font-medium">Educators</div>
                                    </div>
                                    <div className="text-center px-4">
                                        <div className="text-primary font-bold text-2xl mb-1">Modern</div>
                                        <div className="text-gray-500 text-sm font-medium">Facilities</div>
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
                        <h2 className="text-[clamp(22px,4vw,45px)] font-bold text-gray-900 mb-6">Curriculum Structure</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Our curriculum is thoughtfully designed to provide a comprehensive and balanced education, nurturing both intellectual and personal growth.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {program.curriculum.map((item, i) => {
                            const icons = [BookOpen, Users, Trophy, GraduationCap];
                            const Icon = icons[i % icons.length];
                            return (
                                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group hover:-translate-y-1">
                                    <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{item.subject}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Downloads / Resources Section */}
            <div className="max-sm:pt-7 max-sm:pb-5 sm:py-[clamp(20px,5vw,80px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                    <div className="bg-[#2857AE] text-white rounded-3xl p-[clamp(24px,4vw,48px)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-[clamp(15px,3vw,35px)]">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl pointer-events-none" />

                        <div className="relative z-10 lg:max-w-2xl text-center md:text-left">
                            <h2 className="text-[clamp(20px,3vw,36px)] font-bold mb-4">Download {program.title} Prospectus</h2>
                            <p className="text-white/80 text-lg">
                                Get a detailed overview of our curriculum, extracurricular activities, and admissions process in our comprehensive syllabus guide.
                            </p>
                        </div>

                        <div className="relative z-10 shrink-0">
                            <Button className="h-fit py-[clamp(10px,3vw,15px)] px-[clamp(20px,3vw,40px)] rounded-full bg-white text-primary hover:bg-gray-100 font-bold text-sm md:text-lg transition-all duration-300 flex items-center gap-3 group">
                                <Download className="w-5 h-5 lg:group-hover:-translate-y-1 transition-transform" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
