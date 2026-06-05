import React from "react";
import OpportunitiesPage from "@/app/pages-sections/opportunity/page";
import type { Metadata } from "next";
import { fetchOpportunities } from "@/lib/strapi-api";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
    title: "Opportunities",
};

export default async function Page() {
    const opportunities = await fetchOpportunities();

    return <OpportunitiesPage opportunities={opportunities} />;

}
