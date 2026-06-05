"use client"
import React, { useState, useRef } from 'react'
import StrapiImage from '@/components/StrapiImage';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Autoplay, Navigation, Controller, EffectCreative } from 'swiper/modules';
import { ArrowRight, ArrowLeft, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroSlide } from '@/types/strapi';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-creative';

// Static fallback slides used when Strapi is unavailable
const fallbackSlides: HeroSlide[] = [
    {
        id: 1,
        title: "of Tomorrow",
        subtitle: "Shaping the Leaders",
        description: "Our high school program offers a rigorous curriculum designed to prepare students for top universities and future careers. We focus on critical thinking, creativity, and character development.",
        image: "/home/intro1.png",
        ctaPrimaryLabel: "Explore More",
        ctaPrimaryVisible: true,
        ctaSecondaryLabel: "Admissions",
        ctaSecondaryVisible: true,
    },
    {
        id: 2,
        title: "Environments",
        subtitle: "State of the Art Learning",
        description: "A legacy of excellence in education. We provide a world-class environment where students are empowered to achieve their highest potential through rigorous academics and character development.",
        image: "/home/intro2.png",
        ctaPrimaryLabel: "Explore More",
        ctaPrimaryVisible: true,
        ctaSecondaryLabel: "Admissions",
        ctaSecondaryVisible: true,
    },
    {
        id: 3,
        title: "Academics",
        subtitle: "Nurturing Talent Beyond",
        description: "From championship-winning sports teams to award-winning art programs, we believe in holistic development. Discover your passion in our diverse extracurricular activities.",
        image: "/home/intro3.png",
        ctaPrimaryLabel: "Explore More",
        ctaPrimaryVisible: true,
        ctaSecondaryLabel: "Admissions",
        ctaSecondaryVisible: true,
    },
];

interface IntroProps {
    slides?: HeroSlide[];
}

export default function Intro({ slides: slidesProp }: IntroProps) {
    const activeSlides = (slidesProp && slidesProp.length > 0) ? slidesProp : fallbackSlides;
    const [firstSwiper, setFirstSwiper] = useState<SwiperType | null>(null);
    const [secondSwiper, setSecondSwiper] = useState<SwiperType | null>(null);
    const progressContent = useRef<HTMLDivElement>(null);

    const onAutoplayTimeLeft = (s: unknown, time: number, progress: number) => {
        if (progressContent.current) {
            progressContent.current.style.width = `${(1 - progress) * 100}%`;
        }
    };

    return (
        <section className="overflow-clip w-full md:h-[calc(100vh-var(--header-height))] 3xl:max-h-[1100px] relative">
            <div className="absolute inset-0 w-full h-full">
                <Swiper
                    onSwiper={setSecondSwiper}
                    controller={{ control: firstSwiper }}
                    modules={[Controller]}
                    loop={true}
                    speed={1000}
                    allowTouchMove={true}
                    spaceBetween={0}
                    className="w-full h-full"
                >
                    {activeSlides.map((slide, index) => (
                        <SwiperSlide key={index} className="overflow-hidden w-full h-full"
                        >
                            <div className="relative w-full h-full">
                                <StrapiImage
                                    src={slide.image}
                                    alt={slide.title}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                                <div
                                    className="absolute inset-0"
                                    style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.00) 25%, rgba(40,87,174,0.30) 75%), linear-gradient(0deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.40) 100%)' }}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
            <div className="container bg-transparent! max-md:pt-[clamp(200px,4vw,300px)] max-w-[1920px] mx-auto relative z-10 h-full grid grid-cols-1 items-end pb-5 justify-center">
                <div className="w-full px-[clamp(20px,5vw,60px)] grid grid-cols-1 gap-[clamp(30px,3vw,135px)]">
                    <Swiper
                        onSwiper={setFirstSwiper}
                        controller={{ control: secondSwiper }}
                        modules={[Controller, EffectCreative, Autoplay, Navigation]}
                        onAutoplayTimeLeft={onAutoplayTimeLeft}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        loop={true}
                        speed={1000}
                        effect={'creative'}
                        creativeEffect={{
                            prev: {
                                opacity: 0,

                            },
                            next: {
                                opacity: 0,
                            },
                        }}
                        allowTouchMove={false} // Prevent users from swiping text independently
                        className="w-full"
                    >
                        {activeSlides.map((slide, index) => (
                            <SwiperSlide key={index} className='group/slide w-full h-full'>
                                <div className="w-full ">
                                    <div className="space-y-4">
                                       
                                         <h1
                                            className="w-full group-[&.swiper-slide-active]/slide:translate-y-0 line-clamp-2 xl:tracking-[-3px] tracking-normal translate-y-5 opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:delay-500 transition-all duration-500 text-[clamp(25px,4vw,60px)] font-semibold leading-[clamp(45px,6vw,75px)] font-sans bg-clip-text text-transparent bg-[linear-gradient(90deg,#FFF_54.33%,#2857AE_100%)] pb-2"
                                        >
                                            {slide.subtitle} <br />
                                            {slide.title}
                                        </h1>

                                        <p className="group-[&.swiper-slide-active]/slide:translate-y-0 line-clamp-3 translate-y-5 opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:delay-600 transition-all duration-500 max-w-[600px] text-[clamp(16px,2vw,20px)] leading-[clamp(24px,3vw,30px)] font-normal font-sans text-white/70">
                                            {slide.description}
                                        </p>
                                    </div>
                                    {/* CTA Buttons — only render when visibled === true in Strapi */}
                                    {(slide.ctaPrimaryVisible || slide.ctaSecondaryVisible) && (
                                        <div className="flex gap-4 max-xs:flex-col max-xs:flex-wrap pt-8 ">
                                            {slide.ctaPrimaryVisible && (
                                               
                                            <Button size="lg" className="rounded-full max-xs:w-fit cursor-pointer bg-primary lg:hover:bg-primary/90 text-white h-12 px-8 text-lg group-[&.swiper-slide-active]/slide:translate-y-0 translate-y-5 opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:delay-700 transition-all duration-500">
                                                   <a href='academic' className='block h-fit w-fit'>
                                                  {slide.ctaPrimaryLabel} </a>
                                           </Button>
                                        
                                              
                                            )}
                                            {slide.ctaSecondaryVisible && (
                                                <Button variant="outline" size="lg" className="cursor-pointer  max-xs:w-fit rounded-full bg-transparent text-white border-white hover:bg-white/20 hover:text-white h-12 px-8 text-lg group-[&.swiper-slide-active]/slide:translate-y-0 translate-y-5 opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 xs:group-[&.swiper-slide-active]/slide:delay-700 max-xs:group-[&.swiper-slide-active]/slide:delay-900 transition-all duration-500">
                                                    {slide.ctaSecondaryLabel}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom Navigation Controls */}
                    <div className="flex gap-4 pb-5 lg:pb-[clamp(40px,5vw,60px)] items-center lg:pt-5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-white/50 bg-transparent text-white hover:bg-primary cursor-pointer hover:text-white hover:border-white"
                            onClick={() => firstSwiper?.slidePrev()}
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-white/50 bg-transparent hover:bg-primary cursor-pointer text-white hover:text-white hover:border-white"
                            onClick={() => firstSwiper?.slideNext()}
                        >
                            <ArrowRight className="h-6 w-6" />
                        </Button>

                        <div className='h-px w-full bg-white/30'>
                            <div ref={progressContent} className='filled bg-white w-0 h-px'></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
