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
  // Helper for splitting text
    const SplitText = ({ text, className = "", wordClass = "reveal-word" }: { text: string, className?: string, wordClass?: string }) => (
        <>
            {text.split(" ").map((word, i) => (
                <span key={i} className={`${wordClass} inline-block mr-[0.3em] ${className}`}>
                    {word}
                </span>
            ))}
        </>
    );
export default function VideoSection({ videoSectionData }: VideoSectionProps) {
    const containerRef = useRef<HTMLElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add("(min-width: 769px)", () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top", // Start when section hits top of viewport
                    end: "+=2000", // Scroll distance for the animation
                    pin: true, // Pin the section
                    scrub: 1, // Smooth scrubbing
                    anticipatePin: 1
                }
            });

            // 0. Initial Title Animation (happens as we arrive or instantly if stuck)
            // Since we are pinning, let's make sure the title is visible/animated
            tl.fromTo(".title-reveal-word",
                {
                    y: 50,
                    opacity: 0,
                    filter: "blur(10px)"
                },
                {
                    y: 0,
                    opacity: 1,
                    filter: "blur(0px)",
                    duration: 1,
                    stagger: 0.1,
                    ease: "power2.out"
                }
            );

            // 1. Scale Video from 75% to 100%
            tl.fromTo(videoContainerRef.current,
                {
                    width: "95%",
                    borderRadius: "2rem",
                    height: "95%" // Start height
                },
                {
                    width: "100%",
                    height: "100%", // Grow to full screen height
                    borderRadius: "0rem",
                    duration: 4, // More scroll distance/duration
                    ease: "power2.inOut"
                }
            );

            // 2. Reveal Text Overlay (Word by Word)
            // Ensure container is visible first
            gsap.set(".video-overlay-text", { autoAlpha: 1 });

            tl.fromTo(".overlay-reveal-word",
                {
                    y: 20,
                    opacity: 0,
                    filter: "blur(10px)"
                },
                {
                    y: 0,
                    opacity: 1,
                    filter: "blur(0px)",
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power2.out"
                }
            );
        });

    }, { scope: containerRef });

  

    return (
        <section ref={containerRef} className="overflow-clip sm:h-screen h-full bg-white flex flex-col justify-center items-center relative z-10">
            <div className="relative max-w-[1920px] w-full sm:h-[calc(100vh-60px)] px-5 md:px-[calmp(30px,3vw,70px)] py-[clamp(20px,3vw,80px)] overflow-hidden">

                <div className="w-full flex justify-center sm:mb-8 mb-4">
                    <h2 className="video-title text-[clamp(20px,3vw,60px)] font-bold text-primary text-center">
                        <SplitText text={videoSectionData?.title || "The Excellence School"} wordClass="title-reveal-word" />
                    </h2>
                </div>

                {/* Video Container */}
                <div
                    ref={videoContainerRef}
                    className="relative w-full overflow-hidden mx-auto"
                >
                    <video
                        src={videoSectionData?.video || "/video/school-video.mp4"}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="object-cover w-full h-full"
                    />

                    {/* Dark Overlay Gradient */}
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Text Content Overlay */}
                    <div
                        ref={textRef}
                        className="absolute max-sm:left-0 bottom-0 sm:bottom-5 sm:right-0 p-[clamp(20px,5vw,80px)] overflow-hidden max-w-2xl text-white video-overlay-text opacity-100 sm:opacity-0" // Visible on mobile, hidden on desktop (animated)
                    >
                        <p className="text-[clamp(14px,2vw,16px)] font-semibold uppercase tracking-widest mb-2 sm:mb-4 opacity-80 box-decoration-clone">
                            <SplitText text={videoSectionData?.overlaySubtitle || "A Message from the Leadership"} wordClass="overlay-reveal-word" />
                        </p>
                        <blockquote className="text-[clamp(16px,2vw,25px)] font-bold leading-tight mb-2 sm:mb-6">
                            <SplitText text={videoSectionData?.overlayQuote || "\"Our mission is to ensure every student leaves our halls with both knowledge and wisdom.\""} wordClass="overlay-reveal-word" />
                        </blockquote>
                        <p className="text-[clamp(16px,2vw,20px)] text-lg font-medium italic">
                            <SplitText text={videoSectionData?.overlayAuthor || "— Office of the Principal"} wordClass="overlay-reveal-word" />
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
}
