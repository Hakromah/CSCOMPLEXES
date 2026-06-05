"use client";
import { useRef, useEffect } from "react";
import StrapiImage from "@/components/StrapiImage";
import type { StudentLifeData } from "@/types/strapi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
//import Image from "next/image";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

gsap.registerPlugin(ScrollTrigger);

interface StudentLifeProps {
    studentLifeData?: StudentLifeData | null;
}

export default function StudentLife({ studentLifeData }: StudentLifeProps) {
        const containerRef = useRef<HTMLElement>(null);

 useEffect(() => {
        Fancybox.bind("[data-fancybox='gallery']", {});

        return () => {
            Fancybox.unbind("[data-fancybox='gallery']");
            Fancybox.close();
        };
    }, []);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 75%",
                toggleActions: "play none none reverse",
            }
        });

        tl.from(".student-life-header > *", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out"
        })
            .from(".student-card", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="overflow-clip py-[clamp(20px,3vw,100px)] bg-white">
            <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                {/* Header */}
                <div className="student-life-header text-center mb-4 sm:mb-12  sm:space-y-[clamp(15px,3vw,24px)]">
                    <h2 className="text-[clamp(22px,3vw,48px)] text-black leading-normal tracking-normal xl:tracking-[-1px] font-bold">
                        {studentLifeData?.heading ? (
                            <span dangerouslySetInnerHTML={{ __html: studentLifeData.heading.replace('A.M. Fofana', '<span class="text-primary">A.M. Fofana</span>') }} />
                        ) : (
                            <>Student Life at <span className="text-primary">{studentLifeData?.schoolName}</span></>
                        )}
                    </h2>
                    <p className="text-black text-[clamp(16px,2vw,20px)] font-normal text-lg">
                        {studentLifeData?.description || "Beyond the classroom—building memories that last a lifetime"}
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="student-life-grid grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-hidden md:h-[660px]">

                    {/* Left Column: Large Image */}
                    <div className="student-card relative w-full aspect-video max-md:max-h-[400px] md:h-full rounded-[10px] overflow-hidden group">
                       <a href={studentLifeData?.image1 || "/home/4.jpg"} data-fancybox="gallery" className="w-full h-full block">
                        <StrapiImage
                            src={studentLifeData?.image1 || "/home/4.jpg"}
                            alt="Student Life 1"
                            fill
                            className="object-cover relative! w-full! transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                        />
                        </a>
                    </div>

                    {/* Right Column: Nested Grid */}
                    <div className="grid grid-rows-2 gap-4 xs:h-[600px] md:h-full">
                        {/* Top Row: Two Images */}
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <div className="student-card relative w-full h-full md:h-[351px] rounded-[10px] overflow-hidden group">
                               <a href={studentLifeData?.image1 || "/home/8.jpg"} data-fancybox="gallery" className="w-full h-full block">
                                <StrapiImage
                                    src={studentLifeData?.image2 || "/home/8.jpg"} alt="Student Life 2"
                                    fill
                                    className="object-cover  h-full! w-full! relative! transition-transform duration-500 group-hover:scale-105"
                                    unoptimized
                                />
                                </a>
                            </div>
                            <div className="student-card relative w-full h-full rounded-[10px] overflow-hidden group">
                                <a href={studentLifeData?.image1 || "/home/23.jpg"} data-fancybox="gallery" className="w-full h-full block">
                                <StrapiImage
                                    src={studentLifeData?.image3 || "/home/23.png"} alt="Student Life 3"
                                    fill
                                    className="object-cover  h-full! w-full! relative! transition-transform duration-500 group-hover:scale-105"
                                    unoptimized
                                />
                                </a>
                            </div>
                        </div>

                        {/* Bottom Row: Wide Image */}
                        <div className="student-card relative  max-md:aspect-video max-md:max-h-[400px] w-full md:h-[351px] rounded-[10px] overflow-hidden group">
                            <a href={studentLifeData?.image1 || "/home/8.jpg"} data-fancybox="gallery" className="w-full h-full block">
                                <StrapiImage
                                src={studentLifeData?.image4 || "/home/8.jpg"} alt="Student Life 4"
                                fill
                                className="object-cover h-full! w-full! relative! transition-transform duration-500 group-hover:scale-105"
                                unoptimized
                            />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
