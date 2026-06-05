import React from "react";
import AboutPage from "@/app/pages-sections/about/page";
import type { Metadata } from "next";
import { fetchAboutPage, fetchStaffMembers } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "About US",
};

export default async function Page() {
    const [aboutData, leadershipTeam] = await Promise.all([
        fetchAboutPage(),
        fetchStaffMembers({ leadership: true }),
    ]);
    return <AboutPage aboutData={aboutData} leadershipTeam={leadershipTeam} />;
}
