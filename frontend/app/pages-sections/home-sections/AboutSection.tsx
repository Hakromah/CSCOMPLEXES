"use client";

import { useRef } from "react";
import StrapiImage from "@/components/StrapiImage";
import type { AboutPageData } from "@/types/strapi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection({ aboutData }: { aboutData?: AboutPageData | null }) {
    const containerRef = useRef<HTMLElement>(null);

useGSAP(() => {
    const mm = gsap.matchMedia();

    // This will only run if the screen is wider than 768px
    mm.add("(min-width: 769px)", () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".about-school-img", {
            y: 50,
            opacity: 0,
            scale: 0.9,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        })
        .from(".bluerectangle", {
            scale: 0,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.7)"
        }, "-=0.2")
        .from(".about-content > *", {
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.5");
        });
    }, { scope: containerRef });
    return (
        <section ref={containerRef} className="py-20 overflow-clip max-md:py-5 relative">
            <div className="container max-w-1920 mx-auto px-5 md:px-[clamp(20px,5vw,60px)] relative z-10">
                <div className="flex max-lg:flex-col md:mt-30 justify-center gap-5 h-full lg:gap-15 items-center">
                    <div className="about-image relative h-full w-full">
                        <div className="flex max-md:flex-col items-center justify-center h-full w-full relative gap-5">
                            <div className="about-school-img md:w-[285px] md:mt-[-180px] md:h-[387px] max-md:aspect-video relative w-full">
                                <StrapiImage src={aboutData?.homeImage1 || "/home/about.png"} alt="School Life" fill className="object-cover relative! w-full! h-full!" unoptimized />
                            </div>
                            <div className="bluerectangle bg-primary max-md:hidden absolute top-[-22px] left-1/2 -translate-x-1/2 z-[-1] w-[200px] h-[342px]"></div>
                            <div className="about-school-img md:w-[285px] md:h-[387px] max-md:aspect-video max-md:hidden relative w-full max-md:h-full">
                                <StrapiImage src={aboutData?.homeImage2 || "/home/about2.png"} alt="Students" fill className="object-cover relative! w-full! h-full!" unoptimized />
                            </div>
                        </div>

                    </div>
                    {/* Left Content */}
                    <div className="w-full h-full">
                        <div className="about-content w-full lg:max-w-[700px] flex flex-col gap-6 max-md:gap-5 max-xs:gap-3">
                            <div className="space-y-4">
                                <h2 className="text-[clamp(22px,2vw,50px)] max-md:[&_br]:hidden tracking-normal xl:tracking-[-1px] font-bold leading-tight text-[#021A4A]">
                                    {aboutData?.homeHeading ? (
                                        aboutData.homeHeading.split('\n').map((line, i) => (
                                            <span key={i}>{line}<br /></span>
                                        ))
                                    ) : (
                                        <>EDUCATION IS THE KEY TO<br />SUCCESS</>
                                    )}
                                </h2>
                            </div>
                            <p className="text-[#4B5563] text-[clamp(16px,2vw,20px)] font-normal leading-relaxed max-md:leading-normal">
                                {aboutData?.homeDescription || "Our school is a place of learning, growth, and character development. We are committed to providing a balanced education that nurtures academic excellence, moral values, and personal responsibility—preparing students for success in both education and life."}
                            </p>
                            <div className="bg-[linear-gradient(90deg,rgba(229,231,235,0.50)_0%,rgba(248,250,255,0.50)_100%)] gap-6 py-4 max-md:py-2">
                                <div className="flex max-sm:flex-col py-5 max-md:py-2 px-4 gap-5">
                                    <div className="text-primary text-[clamp(16px,2vw,20px)] font-normal text-5 relative before:absolute sm:before:w-px sm:before:h-full before:w-full before:h-px max-sm:before:-bottom-1.5 before:bg-black/10 sm:before:-right-px sm:pr-2">
                                        {aboutData?.homeStat || "49 Years of Educational Excellence"}
                                    </div>
                                    <div className="group/about">
                                        <a href="" className="block w-fit h-fit">
                                            <div className="group flex gap-2 items-center text-[#021A4A] text-[clamp(16px,2vw,18px)] font-normal md:hover:text-primary transition-all duration-500 whitespace-nowrap">About Our School
                                                <span className="transition-all duration-500">
                                                    <svg className="md:group-hover/about:fill-primary fill-[#021A4A] md:group-hover/about:rotate-45 transition-all duration-500" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                                        <path d="M12.3138 1.00009C12.3138 0.447803 11.866 8.76561e-05 11.3138 8.80775e-05L2.31375 8.8204e-05C1.76147 8.78668e-05 1.31375 0.447803 1.31376 1.00009C1.31376 1.55237 1.76147 2.00009 2.31376 2.00009L10.3138 2.00009L10.3138 10.0001C10.3138 10.5524 10.7615 11.0001 11.3138 11.0001C11.866 11.0001 12.3138 10.5524 12.3138 10.0001L12.3138 1.00009ZM0.707153 11.6067L1.41414 12.3138L12.0207 1.70707L11.3136 0.999966L10.6065 0.292859L-7.55191e-05 10.8995L0.707031 11.6066Z" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
