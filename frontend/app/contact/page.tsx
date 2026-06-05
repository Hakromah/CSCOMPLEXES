import ContactPage from "@/app/pages-sections/contact/page";
import type { Metadata } from "next";
import { fetchContactInfo } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Contact",
};

export default async function Page() {
    const contactInfo = await fetchContactInfo();
    return <ContactPage contactInfo={contactInfo} />;
}
