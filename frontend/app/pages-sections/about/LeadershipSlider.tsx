"use client";

import React from "react";
import StrapiImage from "@/components/StrapiImage";
import type { StaffMember } from "@/types/strapi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const defaultTeam = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Principal",
    email: "sarah.mitchell@edu.lb",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Dr. Ibrahim Kamara",
    role: "Principal",
    email: "i.kamara@edu.lb",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Ms. Emily Chen",
    role: "Vice Principal",
    email: "emily.chen@edu.lb",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Mr. David Smith",
    role: "Head of Academics",
    email: "d.smith@edu.lb",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Dr. Ibrahim Kamara",
    role: "Principal",
    email: "i.kamara@edu.lb",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Ms. Emily Chen",
    role: "Vice Principal",
    email: "emily.chen@edu.lb",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "Mr. David Smith",
    role: "Head of Academics",
    email: "d.smith@edu.lb",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "Mr. David Smith",
    role: "Head of Academics",
    email: "d.smith@edu.lb",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
  },
];

interface LeadershipSliderProps {
  leadershipTeam?: StaffMember[];
}

export default function LeadershipSlider({ leadershipTeam: teamProp }: LeadershipSliderProps) {
  const leaders = (teamProp && teamProp.length > 0) ? teamProp.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    email: m.email || '',
    image: m.image,
  })) : defaultTeam;
  return (
    <section className="py-[clamp(25px,3vw,80px)] relative bg-background xs:mb-[clamp(15px,3vw,80px)]">
      <div className="container relative max-w-[1920px] w-full mx-auto px-5 md:px-[clamp(20px,5vw,60px)]">
        <div className="text-center mb-[clamp(20px,3vw,48px)]">
          <h2 className="text-3xl font-bold text-black mb-2">Our Leadership</h2>
          <p className="text-muted-foreground">
            Meet the dedicated team guiding our institution.
          </p>
        </div>

        <div className="relative w-full h-full sm:px-15">
          {/* Custom Navigation Buttons */}
          <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#2857AE] hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#2857AE] flex items-center justify-center text-white hover:bg-[#15346F] transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              prevEl: ".swiper-button-prev-custom",
              nextEl: ".swiper-button-next-custom",
            }}
            pagination={{
              clickable: true,
              el: ".swiper-pagination-custom",
              type: "progressbar",
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="w-full pb-[clamp(20px,3vw,40px)]!"
          >
            {leaders.map((leader: { id: number; name: string; role: string; email: string; image: string }) => (
              <SwiperSlide key={leader.id}>
                <div className="relative group rounded-[clamp(15px,2vw,20px)] overflow-hidden h-[450px] shadow-md">
                  <StrapiImage
                    src={leader.image}
                    alt={leader.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2e2b4f]/90 via-[#2e2b4f]/40 to-transparent flex flex-col justify-end p-6 text-white">
                    <h3 className="text-xl font-bold">{leader.name}</h3>
                    <p className="font-medium text-white/90">{leader.role}</p>
                    <p className="text-xs text-white/70 mt-1">
                      Email: {leader.email}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="w-full h-2 relative sm:w-[calc(100%-120px)] mx-auto overflow-hidden">
          <div className="swiper-pagination-custom w-full  h-1 bg-gray-200 rounded-full overflow-hidden"></div>
        </div>
      </div>
      <style jsx global>{`
        .swiper-pagination-progressbar-fill {
          background-color: #2857ae !important;
        }
      `}</style>
    </section>
  );
}
