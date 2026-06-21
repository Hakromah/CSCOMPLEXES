/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import React, { useState, useEffect } from 'react';
import StrapiImage from '@/components/StrapiImage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft } from 'lucide-react';
import { Fancybox } from '@fancyapps/ui';
// @ts-ignore: side-effect CSS import - no type declarations available for this package
import "@fancyapps/ui/dist/fancybox/fancybox.css";


interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    category: string;
    author: string;
    image: string;
}

interface BlogPostDetailProps {
    post: BlogPost;
}


const defaultSocialLinks = [
    { name: "facebook", href: "#" },
    { name: "instagram", href: "#" },
    { name: "youtube", href: "#" },
    { name: "tiktok", href: "#" },
    { name: "whatsapp", href: "https://wa.me/231880386681" },
    { name: "linkedin", href: "#" },
    { name: "printer", action: "print" },
    { name: "link", action: "copy" },
];

export default function BlogPostDetail({ post }: BlogPostDetailProps) {
    const [copied, setCopied] = useState(false);
    const [settings] = useState<Record<string, string>>({});
    const [openStates, setOpenStates] = useState<Record<string, boolean>>({});



    const cmsSocialLinks = settings.social_links ? JSON.parse(settings.social_links) : [];

    // Merge CMS social links with the default actions (print/copy)
    const socialShareLinks = defaultSocialLinks.map(defaultLink => {
        if (defaultLink.action) return defaultLink;
        const cmsLink = cmsSocialLinks.find((l: { name: string; }) => l.name === defaultLink.name);
        return cmsLink ? cmsLink : defaultLink;
    });

    const handleAction = async (action: string) => {
        if (action === "print") {
            import('print-js').then((module) => {
                const printJS = module.default;
                printJS({
                    printable: 'contToPrint',
                    type: 'html',
                    css: '/print.css',
                    scanStyles: false,
                });
            });
        } else if (action === "copy") {
            navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true);
                setOpenStates(prev => ({ ...prev, copy: true }));
                setTimeout(() => {
                    setCopied(false);
                }, 2000);
            });
        }
    };

    const processContent = (htmlContent: string) => {
        // Find all img tags and their src attributes
        return htmlContent.replace(/<img([^>]*)src=["']([^"']*)["']([^>]*)>/gi, (match, before, src, after) => {
            return `
                <a href="${src}" data-fancybox="gallery" class="block overflow-hidden rounded-xl cursor-zoom-in group">
                    <img ${before} src="${src}" ${after} class="transition-transform duration-500 ease-in-out group-hover:scale-110 w-full h-64 object-cover rounded-xl" />
                </a>
            `;
        });
    };

    const processedContent = processContent(post.content);

    // Initialize Fancybox
    useEffect(() => {
        Fancybox.bind('[data-fancybox="gallery"]', {});

        return () => {
            Fancybox.unbind('[data-fancybox="gallery"]');
            Fancybox.close();
        };
    }, [processedContent]);

    return (
        <div className="w-full bg-background min-h-screen">
            {/* Full Width Hero Image with Overlay */}
            <div className="relative w-full h-[60vh] min-h-[400px]">
                <StrapiImage
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                />
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container mx-auto px-4 text-center text-white">
                        <p className="text-sm md:text-base font-medium mb-4 uppercase tracking-widest opacity-90">
                            Accueil / <Link href="/blog" className="hover:underline">Blog</Link> / <span className="text-white font-bold">Détails de l'article</span>
                        </p>
                        <h1 className="text-3xl md:text-5xl font-bold max-w-4xl mx-auto leading-tight">
                            {post.title}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-[1200px] px-5 md:px-[clamp(20px,3vw,80px)] py-[clamp(25px,3vw,35px)]">
                <div className="w-full h-full">
                    {/* Back Button */}
                    <div className="mb-[clamp(20px,3vw,35px)]">

                        <Link href="/blog">
                            <Button variant="ghost" className="gap-2 pl-0 text-white bg-primary rounded-full duration-500 cursor-pointer">
                                <ArrowLeft className="w-4 h-4" /> Retour aux actualités
                            </Button>
                        </Link>
                    </div>

                    {/* Meta Info */}
                    <div className="mb-[clamp(20px,3vw,35px)]">
                        <span className="text-[#394995] font-bold">Publié le</span>
                        <span className="text-gray-600 ml-2">{post.date}</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-[clamp(20px,3vw,50px)] items-start">
                        {/* Social Share Sidebar */}
                        <div className="md:w-16 w-full md:shrink-0 md:sticky md:top-32 z-10">
                            <div className="flex max-md:flex-row md:flex-col gap-6 max-xs:gap-2 max-xs:justify-between items-center max-sm:overflow-auto bg-white/80 backdrop-blur-sm p-4 rounded-full border border-gray-100 shadow-sm relative">
                                <TooltipProvider delayDuration={200}>

                                    {socialShareLinks.map((social) => (
                                        <div key={social.name} className="relative">
                                            {social.action ? (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip
                                                        open={social.action === 'copy' && copied ? true : openStates[social.action]}
                                                        onOpenChange={(open) => setOpenStates(prev => ({ ...prev, [social.action!]: open }))}
                                                    >
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                onClick={() => handleAction(social.action!)}
                                                                className={`icon icon-${social.name} cursor-pointer text-gray-400 bg-white! lg:hover:text-[#394995] transition-colors w-5 h-5 flex justify-center items-center`}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="text-primary">
                                                            <p className="capitalize text-gray-400 lg:hover:text-[#394995]">
                                                                {social.action === "copy" && copied ? "Copied!" : social.action}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <a
                                                    href={social.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <span
                                                        className={`icon icon-${social.name} ${social.name === "whatsapp" ? "text-[#25D366]/80 hover:text-[#25D366]" : "text-gray-400 hover:text-[#394995]"} transition-colors w-5 h-5 flex justify-center items-center`}
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div id="contToPrint" className="flex-1 contToPrint">
                            <h2 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-6">
                                {post.excerpt || "A.M. Fofana continues to create platforms that inspire excellence beyond the classroom."}
                            </h2>



                            {/* Conditional Scholarship CTA */}
                            {post.category.toLowerCase() === "scholarship" && (
                                <div className="mt-10 p-8 bg-gradient-to-r from-[#394995]/5 to-[#394995]/10 rounded-2xl border border-[#394995]/15 text-center">
                                    <h3 className="text-[clamp(20px,3vw,32px)] font-bold text-gray-900 mb-2">Interested in this scholarship?</h3>
                                    <p className="text-gray-600 mb-6">Submit your application today and take the next step in your academic journey.</p>
                                    <a
                                        href="#"
                                        className="inline-block bg-[#394995] hover:bg-[#1f448c] text-white font-semibold px-10 py-4 rounded-full transition-colors text-base"
                                    >
                                        Apply Now
                                    </a>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
