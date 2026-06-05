"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedCounterProps {
    to: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    duration?: number;
}

export default function AnimatedCounter({
    to,
    prefix = "",
    suffix = "",
    className = "",
    duration = 2,
}: AnimatedCounterProps) {
    const containerRef = useRef<HTMLHeadingElement>(null);
    const formattedValue = Intl.NumberFormat("en-US").format(to);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const rollers = gsap.utils.toArray<HTMLElement>('.digit-roller');

            const targetDigits = formattedValue.split('').filter(char => /^\d$/.test(char)).map(d => parseInt(d));

            gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%", // Trigger when slightly in view
                    once: true,
                }
            }).to(rollers, {
                y: (index) => {
                    const target = targetDigits[index];
                    return `-${target}em`;
                },
                duration: duration,
                ease: "expo.out",
                stagger: 0.1
            });
        }, el);

        return () => ctx.revert();
    }, [formattedValue, duration]);

    return (
        <h3 ref={containerRef} className={`inline-flex items-center justify-center ${className}`}>
            {prefix && <span>{prefix}</span>}

            <span className="inline-flex overflow-hidden items-start" style={{ height: "1em", lineHeight: "1em" }}>
                {formattedValue.split('').map((char, index) => {
                    // Non-digit characters render statically without a roller (e.g., `,`)
                    if (!/^\d$/.test(char)) {
                        return (
                            <span key={index} className="inline-flex items-center justify-center" style={{ height: "1em" }}>
                                {char}
                            </span>
                        );
                    }

                    // Digits render a roller wrapper containing 0-9
                    return (
                        <span key={index} className="inline-flex flex-col digit-roller">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <span
                                    key={num}
                                    className="inline-flex items-center justify-center"
                                    style={{ height: "1em" }}
                                >
                                    {num}
                                </span>
                            ))}
                        </span>
                    );
                })}
            </span>

            {suffix && <span>{suffix}</span>}
        </h3>
    );
}
