import React from "react";
import GalleryPage from "@/app/pages-sections/gallery/page";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";
import { fetchGalleryItems } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Gallery",
};

export default async function Page() {

    const items = await fetchGalleryItems();

    // FIND the first item that actually has breadcrumb data
    const itemWithBreadcrumb = items.find(item => item.breadcrumb_item && item.breadcrumb_item.length > 0);
    const breadcrumbData = itemWithBreadcrumb?.breadcrumb_item?.[0];
    return (
        <div className="overflow-clip">
            <div className="relative -z-1">
                <Breadcrumb
                    title={breadcrumbData?.breadcrumb_title || "Gallery"}
                    description={breadcrumbData?.description || "Capturing moments of excellence, creativity, and community across our elementary, junior, and high school campus in LIB."}
                    image={breadcrumbData?.imageUrl || "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=2070&auto=format&fit=crop"}
                    alt={breadcrumbData?.breadcrumb_title || "Gallery"}
                />
            </div>
            <div className="z-20! relative bg-transparent">
                <GalleryPage items={items} />
            </div>
        </div>
    );
}
