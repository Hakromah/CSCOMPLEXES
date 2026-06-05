"use client";

import React, { useRef } from 'react';
import StrapiImage from '@/components/StrapiImage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import type { Testimonial } from '@/types/strapi';

gsap.registerPlugin(ScrollTrigger);

const fallbackTestimonials: Testimonial[] = [
    { id: 1, type: "PARENT", quote: "The caliber of education and the personal attention our children receive here is unparalleled. Every teacher knows them by name, understands their aspirations, and nurtures their individual talents with genuine dedication.", name: "Ms. Emily Chen", role: "Mother of Charles & Sophia", image: "/home/staff1.png" },
    { id: 2, type: "STUDENT", quote: "The caliber of education and the personal attention our children receive here is unparalleled. Every teacher knows them by name, understands their aspirations, and nurtures their individual talents with genuine dedication.", name: "Ms. Emily Chen", role: "Mother of Charles & Sophia", image: "/home/staff2.png" },
    { id: 3, type: "ALUMNI", quote: "The caliber of education and the personal attention our children receive here is unparalleled. Every teacher knows them by name, understands their aspirations, and nurtures their individual talents with genuine dedication.", name: "Ms. Emily Chen", role: "Mother of Charles & Sophia", image: "/home/staff1.png" },
];

interface TestimonialsSectionProps {
    testimonials?: Testimonial[];
}

export default function TestimonialsSection({ testimonials: testimonialsProp }: TestimonialsSectionProps) {
    const activeTestimonials = (testimonialsProp && testimonialsProp.length > 0) ? testimonialsProp : fallbackTestimonials;
    const containerRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".testimonial-header > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(".testimonial-card-anim", {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    // Triple the testimonials to ensure smooth infinite loop on all screen sizes
    const allTestimonials = [...activeTestimonials, ...activeTestimonials, ...activeTestimonials];

    return (
        <section ref={containerRef} className="overflow-clip py-[clamp(20px,5vw,80px)] bg-white overflow-hidden">
            <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,4vw,60px)]">

                {/* Header Section */}
                <div className="testimonial-header flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 max-md:mb-6 gap-8 max-md:gap-5">
                    <div>
                        <h2 className="text-[clamp(30px,4vw,50px)] font-bold text-[#2857AE] mb-2">
                            Testimonials
                        </h2>
                        <h3 className="text-xl max-md:[&_br]:hidden md:text-2xl text-black font-medium">
                            Voices of Our <br /> Distinguished Community
                        </h3>
                    </div>
                    <div className="lg:max-w-lg lg:text-left">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Excellence in education is measured not by awards alone, but by the lives we touch and the futures we shape. Here are the stories that define our legacy.
                        </p>
                    </div>
                </div>

                {/* Marquee Container */}
                <div className="relative w-full overflow-hidden group">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none hidden md:block" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none hidden md:block" />

                    {/* Scrolling Track */}
                    <div className="flex gap-8 animate-marquee">
                        {allTestimonials.map((testimonial, index) => (
                            <div
                                key={`${testimonial.id}-${index}`}
                                className="flex-shrink-0 w-[400px] md:w-[450px] testimonial-card-anim"
                            >
                                <div className="testimonial-card bg-[#2857AE] text-white rounded-3xl p-8 flex flex-col h-full shadow-lg transition-transform duration-300 hover:-translate-y-2 h-[400px]">
                                    {/* Tag */}
                                    <div className="mb-6">
                                        <span className="bg-white text-[#2857AE] px-3 py-1 rounded text-sm font-bold uppercase tracking-wider inline-block">
                                            {testimonial.type}
                                        </span>
                                    </div>

                                    {/* Quote */}
                                    <blockquote className="text-white/90 text-sm leading-relaxed mb-8 line-clamp-4 flex-grow">
                                        &quot;{testimonial.quote}&quot;
                                    </blockquote>

                                    {/* Profile */}
                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                                            <StrapiImage
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">{testimonial.name}</h4>
                                            <p className="text-white/70 text-sm">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
