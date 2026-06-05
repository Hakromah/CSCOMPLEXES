import React from "react";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumb";
import type { StaffMember } from "@/types/strapi";

const fallbackStaff: StaffMember[] = [
    { id: 1, name: "Sarah Mitchell", role: "Principal", email: "sarah.mitchell@edu.lb", bio: "Leading our institution with 15+ years of educational excellence. Committed to fostering innovation and academic achievement.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop", isFeatured: true, isLeadership: true, breadcrumb_item: [], heading: "" },
    { id: 2, name: "Ms. Emily Chen", role: "Vice Principal", email: "emily.chen@edu.lb", bio: "Leading our institution with 15+ years of educational excellence. Committed to fostering innovation and academic achievement.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop", isFeatured: true, isLeadership: true, breadcrumb_item: [], heading: "" },
    { id: 3, name: "Ms. Jonathan Lee", role: "Head of Science", email: "jonathan.lee@edu.lb", bio: "Leading our institution with 15+ years of educational excellence. Committed to fostering innovation and academic achievement.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop", isFeatured: false, isLeadership: false, breadcrumb_item: [], heading: "" },
];
// const breadcrumbData = staffMembers?.[0]?.breadcrumb_item?.[0];

interface StaffPageProps {
    staffMembers?: StaffMember[];
}

export default function StaffPage({ staffMembers: staffProp }: StaffPageProps) {
    const activeStaff = (staffProp && staffProp.length > 0) ? staffProp : fallbackStaff;

    // FIND the first staff member who actually has a breadcrumb item filled in
    const staffWithBreadcrumb = activeStaff.find(s => s.breadcrumb_item && s.breadcrumb_item.length > 0);
    const breadcrumbData = staffWithBreadcrumb?.breadcrumb_item?.[0];


    return (
        <div className="w-full">
            {/* Hero Section */}
            <Breadcrumb
                title={breadcrumbData?.breadcrumb_title || "Our Staff"}
                description={breadcrumbData?.description || "Moments Captured at A.M. FOFANA High School"}
                image={breadcrumbData?.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"}
                alt={breadcrumbData?.breadcrumb_title || "Staff Hero"}
            />

            {/* Intro Text */}
            <div className="container max-w-[1920px] mx-auto px-5 md:px-[clamp(20px,3vw,80px)] py-[clamp(25px,3vw,48px)] text-center">
                <p className="text-muted-foreground text-center text-lg lg:max-w-3xl mx-auto">
                    {activeStaff.map((staff) => staff.heading).join(" ") || "Stay updated with academic milestones, spiritual growth, and student achievements across all levels."}
                </p>
            </div>

            {/* Staff Grid Section */}
            <section className="pb-[clamp(25px,3vw,80px)] bg-background">
                <div className="container mx-auto max-w-[1920px] px-[clamp(30px,2vw,150px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(20px,3vw,30px)] gap-y-[clamp(30px,3vw,48px)]">
                        {activeStaff.map((staff) => (


                            <div key={staff.id} className="bg-[linear-gradient(180deg,_#FFF_0%,_#2857AE_100%)] h-[470px] rounded-[20px] p-6 text-center max-md:h-full flex flex-col items-center justify-center group transition-transform duration-300 hover:-translate-y-2 shadow-lg">

                                <div className="w-full h-full flex flex-col justify-center items-center  ">
                                    {/* Image Container */}
                                    <div className="relative w-[174px] h-[189px] mb-3 rounded-[20px] overflow-hidden">
                                        <Image
                                            src={staff.image}
                                            alt={staff.name}
                                            fill
                                            unoptimized
                                            className="object-cover w-full h-full" />
                                    </div>

                                    {/* Content */}
                                    <div className='flex flex-col'>
                                        <h3 className="text-[clamp(20px,3vw,25px)] font-bold leading-normal text-white mb-2">{staff.name}</h3>
                                        <div className="flex items-center text-[clamp(16px,3vw,20px)] justify-center gap-2 text-white/90 leading-normal font-medium mb-1">
                                            <span className="w-4 h-[1px] bg-white/60"></span>
                                            {staff.role}
                                        </div>
                                        <p className="text-white/70 text-[16px] mb-[9px]">Email: {staff.email}</p>
                                        <div className="w-full h-[1px] bg-white/20 mb-[9px]"></div>
                                        <p className="text-white/90 text-4 leading-relaxed mb-4 line-clamp-4">
                                            {staff.bio}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
