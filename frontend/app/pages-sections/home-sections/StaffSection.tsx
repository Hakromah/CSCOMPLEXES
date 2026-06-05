"use client";

import React, { useState, useRef } from 'react';
import StrapiImage from '@/components/StrapiImage';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Navigation, Autoplay } from 'swiper/modules';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import type { StaffMember } from '@/types/strapi';

import 'swiper/css';
import 'swiper/css/navigation';

gsap.registerPlugin(ScrollTrigger);

const fallbackStaff: StaffMember[] = [
    {
        id: 1, name: "Sarah Mitchell", role: "Principal", email: "sarahmitchell@edu.lib", image: "/home/staff1.png", bio: "Leading our institution with 15+ years of educational excellence. Committed to fostering innovation and academic achievement.", isFeatured: true, isLeadership: true,
        heading: '',
        breadcrumb_item: []
    },
    {
        id: 2, name: "Ms. Emily Chen", role: "Vice Principal", email: "emilychen@edu.lib", image: "/home/staff2.png", bio: "Dedicated to student welfare and curriculum development. Ensuring a supportive and inclusive learning environment for all.", isFeatured: true, isLeadership: true,
        heading: '',
        breadcrumb_item: []
    },
    {
        id: 3, name: "Mr. David Ross", role: "Head of Science", email: "davidross@edu.lib", image: "/home/staff1.png", bio: "Inspiring curiosity and scientific inquiry. Passionate about STEM education and hands-on learning experiences.", isFeatured: true, isLeadership: false,
        heading: '',
        breadcrumb_item: []
    },
    {
        id: 4, name: "Mrs. Lisa Wong", role: "Head of Arts", email: "lisawong@edu.lib", image: "/home/staff2.png", bio: "Cultivating creativity and artistic expression. Believes in the power of arts to transform lives and perspectives.", isFeatured: true, isLeadership: false,
        heading: '',
        breadcrumb_item: []
    },
];

interface StaffSectionProps {
    staffMembers?: StaffMember[];
}

export default function StaffSection({ staffMembers: staffProp }: StaffSectionProps) {
    const activeStaff = (staffProp && staffProp.length > 0) ? staffProp : fallbackStaff;
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const containerRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".staff-content > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(".staff-swiper .swiper-slide", {
                x: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="overflow-clip py-[clamp(20px,3vw,80px)] bg-[#C7D4FF80]/50 text-white ">
            <div className="container overflow-hidden mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                <div className="sm:grid max-sm:grid-cols-1 sm:grid-cols-4 gap-10 lg:gap-[clamp(15px,3vw,80px)] items-center">
                    <div className="staff-content cols-pan-1 w-full flex flex-col items-start text-left">
                        <h2 className="text-[clamp(20px,4vw,60px)] font-bold mb-3 sm:mb-6 text-black">STAFF</h2>
                        <p className="text-black text-[clamp(16px,2vw,18px)] w-full leading-relaxed mb-4 md:mb-10">
                            Stay updated with academic milestones, spiritual growth, and student achievements across all levels.
                        </p>
                        <div className="flex gap-4 mt-auto">
                            <Button
                                variant="outline"
                                size="icon"
                                className="group/previous cursor-pointer rounded-full h-14 w-14 max-md:w-10 max-md:h-10 bg-primary duration-500 border-0  text-white lg:hover:text-black lg:hover:bg-white transition-colors"
                                onClick={() => swiperInstance?.slidePrev()}
                            >
                                <ArrowLeft className="h-6 w-6 lg:group-hover/previous:text-black duration-500 text-white" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="group/next cursor-pointer rounded-full h-14 w-14 max-md:w-10 max-md:h-10 bg-primary duration-500 border-0  text-white lg:hover:text-black lg:hover:bg-white transition-colors"
                                onClick={() => swiperInstance?.slideNext()}
                            >
                                <ArrowRight className="h-6 w-6 lg:group-hover/next:text-black duration-500 text-white" />
                            </Button>
                        </div>
                    </div>
                    <div className="w-full max-sm:mt-8 overflow-hidden h-full col-span-3 relative">
                        <div className="staff-swiper w-full">
                            <Swiper
                                onSwiper={setSwiperInstance}
                                modules={[Navigation, Autoplay]}
                                spaceBetween={30}
                                slidesPerView={1.2}
                                breakpoints={{
                                    640: {
                                        slidesPerView: 2,
                                    },
                                    1024: {
                                        slidesPerView: 2.1, // See 2 full and a bit of 3rd
                                    },
                                    1280: {
                                        slidesPerView: 2.5,
                                    }
                                }}
                                className="overflow-visible! py-10" // Padding for hover effects/shadows
                            >
                                {activeStaff.map((member) => (
                                    <SwiperSlide key={member.id} className="h-auto">

                                        <div className="bg-[linear-gradient(180deg,#FFF_0%,#2857AE_100%)] h-[470px] rounded-[20px] p-6 text-center max-md:h-full flex flex-col items-center justify-center group transition-transform duration-300 hover:-translate-y-2 shadow-lg">

                                            <div className="w-full h-full flex flex-col justify-center items-center  ">
                                                {/* Image Container */}
                                                <div className="relative w-[174px] h-[189px] mb-3 rounded-[20px] overflow-hidden">
                                                    <StrapiImage
                                                        src={member.image}
                                                        alt={member.name}
                                                        fill
                                                        className="object-cover w-full h-full" />
                                                </div>

                                                {/* Content */}
                                                <div className='flex flex-col'>
                                                    <h3 className="text-[clamp(20px,3vw,25px)] font-bold leading-normal text-white mb-2">{member.name}</h3>
                                                    <div className="flex items-center text-[clamp(16px,3vw,20px)] justify-center gap-2 text-white/90 leading-normal font-medium mb-1">
                                                        <span className="w-4 h-px bg-white/60"></span>
                                                        {member.role}
                                                    </div>
                                                    <p className="text-white/70 text-[16px] mb-[9px]">Email: {member.email}</p>
                                                    <div className="w-full h-px bg-white/20 mb-[9px]"></div>
                                                    <p className="text-white/90 text-4 leading-relaxed mb-4 line-clamp-4">
                                                        {member.bio}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
