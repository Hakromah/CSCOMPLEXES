"use client";

import { useRef } from "react";
//import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { VideoSectionData } from "@/types/strapi";

gsap.registerPlugin(ScrollTrigger);

interface VideoSectionProps {
    videoSectionData?: VideoSectionData | null;
}

export default function VideoSection({ videoSectionData }: VideoSectionProps) {
    const containerRef = useRef<HTMLElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);


    return (
        <section className="overflow-clip  h-full bg-white flex flex-col justify-center items-center relative z-10">
            <div className="relative max-w-[1920px] w-full h-full px-5 md:px-[calmp(30px,3vw,70px)] py-[clamp(20px,3vw,80px)] overflow-hidden">

                <div className="w-full flex justify-center sm:mb-8 mb-4">
                    <h2 className="video-title text-[clamp(20px,3vw,60px)] font-bold text-primary text-center">
                        {videoSectionData?.title || "The Excellence School"}
                    </h2>
                </div>

                {/* Video Container */}
                <div
                    ref={videoContainerRef}
                    className="relative w-full h-[calc(100vh-200px)] overflow-hidden mx-auto rounded-[12px]"
                >
                    <video src={videoSectionData?.video || "/video/school-video.mp4"} autoPlay muted loop playsInline className="object-cover w-full h-full"
                    />
                    {/* Dark Overlay Gradient */}
                    <div className="absolute inset-0 bg-black/30" />
                    {/* Text Content Overlay */}
                    <div
                        ref={textRef}
                        className="absolute max-sm:left-0 bottom-5 sm:bottom-5 sm:right-0 p-[clamp(20px,5vw,80px)] overflow-hidden max-w-2xl text-white" // Visible on mobile, hidden on desktop (animated)
                    >
                        <p className="text-[clamp(14px,2vw,16px)] font-semibold uppercase tracking-widest mb-2 sm:mb-4 opacity-80 box-decoration-clone">
                          {videoSectionData?.overlaySubtitle || "A Message from the Leadership"}
                        </p>
                        <blockquote className="text-[clamp(16px,2vw,25px)] font-bold leading-tight mb-2 sm:mb-6">
                          {videoSectionData?.overlayQuote || "\"Our mission is to ensure every student leaves our halls with both knowledge and wisdom.\""}
                        </blockquote>
                        <p className="text-[clamp(16px,2vw,20px)] text-lg font-medium italic">
                          {videoSectionData?.overlayAuthor || "— Office of the Principal"}
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
}
