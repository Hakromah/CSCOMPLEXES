import ContactPage from "@/app/pages-sections/contact/page";
import type { Metadata } from "next";
import { fetchContactInfo, fetchMapSetting } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Contact",
};

export default async function Page() {
    const [contactInfo, mapSetting] = await Promise.all([
        fetchContactInfo(),
        fetchMapSetting(),
    ]);
    return <ContactPage contactInfo={contactInfo} mapSetting={mapSetting} />;
}
