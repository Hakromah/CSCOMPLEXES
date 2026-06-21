/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/types/strapi";
import { Play, ArrowRight, ArrowLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Fancybox } from "@fancyapps/ui";

// @ts-ignore: Missing type declarations for CSS side-effect import
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// @ts-ignore: Missing type declarations for CSS side-effect import
// Import Swiper styles
import "swiper/css";
// @ts-ignore: Missing type declarations for CSS side-effect import
import "swiper/css/navigation";

interface GalleryPageProps {
  items?: GalleryItem[];
}

export default function GalleryPage({ items = [] }: GalleryPageProps) {
  const [activeMediaType, setActiveMediaType] = useState<"image" | "video">(
    "image",
  );
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [visibleGridCount, setVisibleGridCount] = useState(6);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive categories dynamically from whatever Strapi returns
  const categories: string[] = [
    "Tous",
    ...Array.from(
      new Set(
        items
          .map((item) => item.category)
          .filter((cat) => cat !== null) as string[]
      )
    ),
  ];

  const filteredItems = items.filter(
    (item) =>
      (activeMediaType === "video"
        ? item.type === "video"
        : item.type === "image") &&
      (activeCategory === "Tous" || item.category === activeCategory),
  );

  // Filter items for the grid (only images)
  const gridItems = items.filter((item: GalleryItem) => item.type === "image");

  useEffect(() => {
    const container = containerRef.current;
    const delegate = "[data-fancybox]";
    const options = {
      Carousel: {
        infinite: false,
      },
    };

    Fancybox.bind(container, delegate, options);

    return () => {
      Fancybox.unbind(container);
      Fancybox.close();
    };
  }, [filteredItems, visibleGridCount]);

  return (
    <div className="w-full h-full" ref={containerRef}>
      <div className="w-full h-full relative bg-linear-to-t pb-[clamp(20px,3vw,150px)] from-primary/10 to-white">
        <div className="container mx-auto overflow-hidden py-[clamp(20px,3vw,100px)] px-5 md:px-[clamp(20px,3vw,60px)]">
          {/* 1. Toggle Switch (Segmented Control) */}
          <div className="flex justify-center w-fit max-w-500 mx-auto mb-8 absolute left-1/2 -translate-x-1/2 -top-7 z-10 ">
            <div className="bg-[#F8F9FA] p-1.5 rounded-full inline-flex items-center gap-1">
              <Button
                onClick={() => setActiveMediaType("image")}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer text-nowrap transition-all duration-300 ${activeMediaType === "image"
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 bg-transparent"
                  }`}
              >
                Galerie Photos
              </Button>
              <Button
                onClick={() => setActiveMediaType("video")}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer text-nowrap transition-all duration-300 ${activeMediaType === "video"
                  ? "bg-[#394995] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900 bg-transparent"
                  }`}
              >
                Galerie Vidéos
              </Button>
            </div>
          </div>


          {/* 2. Filter Buttons (Pills) */}
          <div className="w-full h-fit flex justify-center items-center">
            <div className="galleryBtn flex overflow-x-auto whitespace-nowrap overflow-auto gap-3 mt-[clamp(40px,3vw,70px)] mb-[clamp(20px,3vw,50px)] z-10 pb-2 relative">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-w-[80px] flex justify-center items-center px-6 py-2 rounded-full border cursor-pointer text-sm font-medium transition-all duration-200 ${activeCategory === cat
                    ? "bg-[#394995] text-white border-[#394995]"
                    : "bg-white text-[#394995] border-[#394995] hover:bg-blue-50"
                    }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* 3. Slider Section */}
          <div className="relative">
            <Swiper
              modules={[Navigation]}
              spaceBetween={24}
              slidesPerView={1.2}
              centeredSlides={false}
              navigation={{
                nextEl: ".custom-next",
                prevEl: ".custom-prev",
              }}
              breakpoints={{
                640: { slidesPerView: 2.2 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4 },
              }}
              className="w-full pb-10 !overflow-visible"
            >
              {filteredItems.map((item) => (
                <SwiperSlide key={item.id} className="h-auto">
                  <a
                    data-fancybox="gallery-slider"
                    href={item.src}
                    data-caption={item.title}
                    className="relative group cursor-pointer overflow-hidden rounded-[24px] aspect-[4/5] w-full bg-gray-100 block"
                  >
                    <Image
                      src={
                        item.type === "video" ? item.thumbnail || "" : item.src
                      }
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Video Play Icon Overlay */}
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-5 h-5 text-[#394995] fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* 4. Custom Navigation Buttons (Centered Below) */}
            <div className="flex justify-center gap-4 mt-8">
              <Button className="custom-prev w-10 h-10 rounded-full bg-[#DCE4F2] text-[#394995] flex items-center justify-center hover:bg-[#394995] hover:text-white transition-colors duration-300 disabled:opacity-50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button className="custom-next w-10 h-10 rounded-full bg-[#394995] text-white flex items-center justify-center hover:bg-[#1e408a] transition-colors duration-300 disabled:opacity-50">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">
                  Aucun élément trouvé pour cette catégorie.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-[1920px] mx-auto px-5 max-sm:pb-5 sm:py-[clamp(20px,3vw,80px)]  md:px-[clamp(20px,3vw,60px)]">
        {/* 5. Past Events Grid Section */}
        <div className="mt-[clamp(20px,3vw,50px)] text-center">
          <h2 className="text-[clamp(20px,3vw,50px)] font-bold text-primary mb-[clamp(20px,3vw,50px)]">
            Nos événements passés
          </h2>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6 mb-[clamp(25px,3vw,50px)]">
            {gridItems.slice(0, visibleGridCount).map((item) => (
              <a
                key={`grid-${item.id}`}
                data-fancybox="gallery-grid"
                href={item.src}
                data-caption={item.title}
                className="relative h-[400px] rounded-2xl overflow-hidden group cursor-pointer block"
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Optional: Hover Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-medium">{item.title}</span>
                </div>
              </a>
            ))}
          </div>

          {visibleGridCount < gridItems.length && (
            <Button
              onClick={() => setVisibleGridCount((prev) => prev + 6)}
              className="px-8 py-6 rounded-full bg-[#394995] cursor-pointer hover:bg-[#1e408a] text-white text-lg"
            >
              Charger plus
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
