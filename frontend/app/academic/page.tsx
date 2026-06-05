import React from "react";
import AcademicPage from "@/app/pages-sections/academic/page";
import type { Metadata } from "next";
import { fetchAcademicSections, fetchAcademicResources, fetchSchoolCalendars } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Academic",
};

export default async function Page() {
    const [sections, resources, calendars] = await Promise.all([
        fetchAcademicSections(),
        fetchAcademicResources(),
        fetchSchoolCalendars(),
    ]);
    return <AcademicPage sections={sections} resources={resources} calendars={calendars} />;
}
