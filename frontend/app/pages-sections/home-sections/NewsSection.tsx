/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from 'react';
import StrapiImage from '@/components/StrapiImage';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { BlogPost } from '@/types/strapi';

import 'swiper/css';
import 'swiper/css/navigation';

gsap.registerPlugin(ScrollTrigger);

// FIX 1: Added breadcrumb_item to satisfy TypeScript 'BlogPost' requirement
const fallbackNewsItems: BlogPost[] = [
    {
        id: 1,
        date: "Jan 11, 2026",
        category: "Events",
        title: "Developing Critical Thinkers: The Annual Junior High Debate Cup",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "A display of brilliant minds as our Junior High students tackled complex global issues in our annual debate finals...",
        content: "",
        author: "",
        slug: "1",
        breadcrumb_item: [],
    },
    {
        id: 2,
        date: "Jan 11, 2026",
        category: "Academics",
        title: "Scientific Breakthroughs: Students Present Research at State Fair",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "Our young scientists showcased their innovative projects, earning top honors and recognition for their detailed research...",
        content: "",
        author: "",
        slug: "2",
        breadcrumb_item: [],
    },
    {
        id: 3,
        date: "Jan 11, 2026",
        category: "Events",
        title: "Cultural Heritage Day: Celebrating Diversity on Campus",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "Students and faculty came together to share traditions, food, and performances, fostering a deeper understanding of our global community...",
        content: "",
        author: "",
        slug: "3",
        breadcrumb_item: [],
    },
    {
        id: 4,
        date: "Jan 11, 2026",
        category: "Sports",
        title: "Championship Victory: Soccer Team Takes the Trophy",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        excerpt: "In a thrilling final match, our varsity team demonstrated exceptional teamwork and determination to secure the regional championship...",
        content: "",
        author: "",
        slug: "4",
        breadcrumb_item: [],
    },
];

interface NewsSectionProps {
    newsItems?: BlogPost[];
}

export default function NewsSection({ newsItems: newsItemsProp }: NewsSectionProps) {
    const activeItems = (newsItemsProp && newsItemsProp.length > 0) ? newsItemsProp : fallbackNewsItems;
    const containerRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".news-header > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(".news-swiper .swiper-slide", {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="overflow-clip py-[clamp(20px,3vw,100px)] bg-white relative overflow-hidden">
            <div className="background-gradient max-md:hidden absolute top-0 left-0 w-[clamp(250px,70vw,405px)] h-[clamp(400px,70vw,588px)] bg-gradient-to-r from-primary to-white z-1"></div>
            <div className="container z-10 relative mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

                <div className="news-header flex flex-col md:flex-row justify-between md:items-end md:mb-12 mb-6 gap-8">
                    <div>
                        <h2 className="text-[clamp(20px,4vw,50px)] font-bold text-black mb-4">
                            Latest from our Campus
                        </h2>
                        <p className="text-black text-[clamp(16px,3vw,18px)] lg:max-w-2xl">
                            Stay updated with academic milestones, spiritual growth, and student achievements across all levels.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                            {/* FIX 2: Replaced refs with CSS classes 'news-prev' and 'news-next' to avoid render access errors */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="news-prev-btn group/previous cursor-pointer rounded-full h-14 w-14 max-md:w-10 max-md:h-10 bg-primary duration-500 border-0 text-white lg:hover:text-black lg:hover:bg-white transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6 lg:group-hover/previous:text-black duration-500 text-white" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="news-next-btn group/next cursor-pointer rounded-full h-14 w-14 max-md:w-10 max-md:h-10 bg-primary duration-500 border-0 text-white lg:hover:text-black lg:hover:bg-white transition-colors"
                            >
                                <ArrowRight className="h-6 w-6 lg:group-hover/next:text-black duration-500 text-white" />
                            </Button>
                        </div>

                        <Link href="/blog" className="flex items-center gap-2 text-primary font-medium hover:underline">
                            All News <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <div className="news-swiper">
                    <Swiper
                        modules={[Navigation, Autoplay]}
                        spaceBetween={24}
                        slidesPerView={1.2}
                        // FIX 3: Use class string selectors instead of ref.current
                        navigation={{
                            prevEl: '.news-prev-btn',
                            nextEl: '.news-next-btn',
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2.2 },
                            1024: { slidesPerView: 3.2 },
                        }}
                        className="!overflow-visible py-4"
                    >
                        {activeItems.map((item) => (
                            <SwiperSlide key={item.id} className="h-auto">
                                <div className="group cursor-pointer">
                                    <div className="relative h-[336px] w-full rounded-2xl overflow-hidden mb-6">
                                        <StrapiImage
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <span className="text-gray-900">{item.date}</span>
                                            <span className="text-primary">•</span>
                                            <span className="text-primary">{item.category}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                            {item.title}
                                        </h3>

                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                            {item.excerpt}
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
}

// "use client";

// import React, { useState, useRef } from 'react';
// import StrapiImage from '@/components/StrapiImage';
// import Link from 'next/link';
// import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Swiper as SwiperType } from 'swiper';
// import { Navigation, Autoplay } from 'swiper/modules';
// import { Button } from '@/components/ui/button';
// import gsap from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import { useGSAP } from '@gsap/react';
// import type { BlogPost } from '@/types/strapi';

// import 'swiper/css';
// import 'swiper/css/navigation';

// gsap.registerPlugin(ScrollTrigger);

// const fallbackNewsItems: BlogPost[] = [
//     {
//         id: 1,
//         date: "Jan 11, 2026",
//         category: "Events",
//         title: "Developing Critical Thinkers: The Annual Junior High Debate Cup",
//         image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//         excerpt: "A display of brilliant minds as our Junior High students tackled complex global issues in our annual debate finals...",
//         content: "",
//         author: "",
//         slug: "1",
//         breadcrumb_item: [],
//     },
//     {
//         id: 2,
//         date: "Jan 11, 2026",
//         category: "Academics",
//         title: "Scientific Breakthroughs: Students Present Research at State Fair",
//         image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//         excerpt: "Our young scientists showcased their innovative projects, earning top honors and recognition for their detailed research...",
//         content: "",
//         author: "",
//         slug: "2",
//         breadcrumb_item: [],
//     },
//     {
//         id: 3,
//         date: "Jan 11, 2026",
//         category: "Events",
//         title: "Cultural Heritage Day: Celebrating Diversity on Campus",
//         image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//         excerpt: "Students and faculty came together to share traditions, food, and performances, fostering a deeper understanding of our global community...",
//         content: "",
//         author: "",
//         slug: "3",
//         breadcrumb_item: [],
//     },
//     {
//         id: 4,
//         date: "Jan 11, 2026",
//         category: "Sports",
//         title: "Championship Victory: Soccer Team Takes the Trophy",
//         image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//         excerpt: "In a thrilling final match, our varsity team demonstrated exceptional teamwork and determination to secure the regional championship...",
//         content: "",
//         author: "",
//         slug: "4",
//         breadcrumb_item: [],
//     },
// ];

// interface NewsSectionProps {
//     newsItems?: BlogPost[];
// }

// export default function NewsSection({ newsItems: newsItemsProp }: NewsSectionProps) {
//     const activeItems = (newsItemsProp && newsItemsProp.length > 0) ? newsItemsProp : fallbackNewsItems;
//     const containerRef = useRef<HTMLElement>(null);
//     const prevRef = useRef<HTMLButtonElement>(null);
//     const nextRef = useRef<HTMLButtonElement>(null);

//     useGSAP(() => {
//         const tl = gsap.timeline({
//             scrollTrigger: {
//                 trigger: containerRef.current,
//                 start: "top 80%",
//                 toggleActions: "play none none reverse",
//             }
//         });

//         tl.from(".news-header > *", {
//             y: 30,
//             opacity: 0,
//             duration: 0.8,
//             stagger: 0.1,
//             ease: "power3.out"
//         })
//             .from(".news-swiper .swiper-slide", {
//                 y: 50,
//                 opacity: 0,
//                 duration: 0.8,
//                 stagger: 0.1,
//                 ease: "power3.out"
//             }, "-=0.4");

//     }, { scope: containerRef });

//     return (
//         <section ref={containerRef} className="overflow-clip py-[clamp(20px,3vw,100px)] bg-white relative overflow-hidden">
//             <div className="background-gradient max-md:hidden absolute top-0 left-0 w-[clamp(250px,70vw,405px)] h-[clamp(400px,70vw,588px)] bg-gradient-to-r from-primary to-white z-1"></div>
//             <div className="container z-10 relative mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
//                 {/* Header Section */}
//                 <div className="news-header flex flex-col md:flex-row justify-between md:items-end md:mb-12 mb-6 gap-8">
//                     <div>
//                         <h2 className="text-[clamp(20px,4vw,50px)] font-bold text-black mb-4">
//                             Latest from our Campus
//                         </h2>
//                         <p className="text-black text-[clamp(16px,3vw,18px)] lg:max-w-2xl">
//                             Stay updated with academic milestones, spiritual growth, and student achievements across all levels.
//                         </p>
//                     </div>

//                     <div className="flex items-center gap-6">
//                         <div className="flex gap-2">
//                             <Button
//                                 ref={prevRef}
//                                 variant="outline"
//                                 size="icon"
//                                 className="group/previous cursor-pointer rounded-full h-14 w-14 max-md:w-10 max-md:h-10 bg-primary duration-500 border-0  text-white lg:hover:text-black lg:hover:bg-white transition-colors"
//                             >
//                                 <ArrowLeft className="h-6 w-6 lg:group-hover/previous:text-black duration-500 text-white" />

//                             </Button>
//                             <Button
//                                 ref={nextRef}
//                                 variant="outline"
//                                 size="icon"
//                                 className="group/next cursor-pointer rounded-full h-14 w-14 max-md:w-10 max-md:h-10 bg-primary duration-500 border-0  text-white lg:hover:text-black lg:hover:bg-white transition-colors"
//                             >
//                                 <ArrowRight className="h-6 w-6 lg:group-hover/next:text-black duration-500 text-white" />

//                             </Button>
//                         </div>

//                         <Link href="/blog" className="flex items-center gap-2 text-primary font-medium hover:underline">
//                             All News <ArrowUpRight className="h-4 w-4" />
//                         </Link>
//                     </div>
//                 </div>

//                 {/* Swiper */}
//                 <div className="news-swiper">
//                     <Swiper
//                         modules={[Navigation, Autoplay]}
//                         spaceBetween={24}
//                         slidesPerView={1.2}
//                         navigation={{
//                             prevEl: prevRef.current,
//                             nextEl: nextRef.current,
//                         }}
//                         onBeforeInit={(swiper) => {
//                             // Assign refs to navigation params
//                             if (typeof swiper.params.navigation !== 'boolean') {
//                                 const nav = swiper.params.navigation as any;
//                                 nav.prevEl = prevRef.current;
//                                 nav.nextEl = nextRef.current;
//                             }
//                         }}
//                         breakpoints={{
//                             640: {
//                                 slidesPerView: 2.2,
//                             },
//                             1024: {
//                                 slidesPerView: 3.2,
//                             },

//                         }}
//                         className="!overflow-visible py-4"
//                     >
//                         {activeItems.map((item) => (
//                             <SwiperSlide key={item.id} className="h-auto">
//                                 <div className="group cursor-pointer">
//                                     {/* Image */}
//                                     <div className="relative h-[336px] w-full rounded-2xl overflow-hidden mb-6">
//                                         <StrapiImage
//                                             src={item.image}
//                                             alt={item.title}
//                                             fill
//                                             className="object-cover transition-transform duration-500 group-hover:scale-105"
//                                         />
//                                     </div>

//                                     {/* Content */}
//                                     <div className="space-y-3">
//                                         <div className="flex items-center gap-2 text-sm font-semibold">
//                                             <span className="text-gray-900">{item.date}</span>
//                                             <span className="text-primary">•</span>
//                                             <span className="text-primary">{item.category}</span>
//                                         </div>

//                                         <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
//                                             {item.title}
//                                         </h3>

//                                         <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
//                                             {item.excerpt}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </SwiperSlide>
//                         ))}
//                     </Swiper>
//                 </div>

//             </div>
//         </section>
//     );
// }
