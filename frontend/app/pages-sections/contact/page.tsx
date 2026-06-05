"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import dynamic from 'next/dynamic';
import type { ContactInfoData } from '@/types/strapi';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

const fallbackSocialLinks = [
    { name: "facebook", href: "#" },
    { name: "instagram", href: "#" },
    { name: "x", href: "#" },
    { name: "youtube", href: "#" },
    { name: "tiktok", href: "#" },
    { name: "whatsapp", href: "https://wa.me/231880386681" },
];

interface ContactPageProps {
    contactInfo?: ContactInfoData | null;
}

export default function ContactPage({ contactInfo }: ContactPageProps) {

    const breadcrumbData = contactInfo?.breadcrumb_item?.[0];

    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const socialLinks = contactInfo?.socialLinks ?? fallbackSocialLinks;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tid = toast.loading("Sending your message...");
        try {
            await api.post('/contact-messages', {
                data: formData
            });
            toast.success("Message sent successfully! We will get back to you shortly.", { id: tid });
            setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error("Failed to submit contact form:", error);
            toast.error("Failed to send message. Please try again later.", { id: tid });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-background">
            {/* Header */}
            <Breadcrumb
                title={breadcrumbData?.breadcrumb_title || "Contact Us"}
                description={breadcrumbData?.description || "We're here to help. Reach out to us with any questions about admissions, academics, or school life."}
                image={breadcrumbData?.imageUrl || "/home/intro3.png"}
                alt={breadcrumbData?.breadcrumb_title || "Contact Us"}
            />

            {/* Contact Content */}
            <section className="py-[clamp(25px,3vw,80px)]">
                <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
                    {/* Top Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-sm:gap-5 mb-[clamp(30px,3vw,80px)]">
                        {/* Address Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <a href="" className='max-md:w-full flex flex-col md:items-center items-start md:text-center'>
                                <div className="h-12 max-sm:hidden w-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                    <span className='icon icon-map flex items-center justify-center text-primary h-5 w-5'></span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">Address</h3>
                                <p className="text-gray-600 max-md:[&_br]:hidden max-md:w-full max-md:text-left text-sm leading-relaxed whitespace-pre-line">
                                    {contactInfo?.address ? contactInfo.address : (
                                        <>A.M. FOFANA High School Sinkor<br />
                                        Fish Market Monrovia, Liberia<br />
                                        West Africa</>
                                    )}
                                </p>
                            </a>
                        </div>

                        {/* Phone Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12 w-12  max-sm:hidden bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">

                                <span className='icon icon-phone flex items-center justify-center text-primary h-5 w-5'></span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Phone</h3>
                            <div className="flex flex-col max-md:flex-row gap-3 text-gray-600 max-md:[&_br]:hidden text-sm leading-relaxed">
                                {contactInfo?.phones && contactInfo.phones.length > 0 ? (
                                    contactInfo.phones.map((phone, i) => (
                                        <p key={i}> <a href={`tel:${phone.replace(/\s+/g, '')}`} className='block w-fit h-fit'>{phone}</a> </p>
                                    ))
                                ) : (
                                    <>
                                        <p> <a href="" className='block w-fit h-fit'>  +231 054 678 13 13 </a> </p>
                                        <p> <a href="" className='block w-fit h-fit'> +231 077 123 4567 </a> </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Email Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12  max-sm:hidden w-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <span className='icon icon-mail flex items-center justify-center text-primary h-5 w-5'></span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Email</h3>
                            <div className="flex flex-col gap-2">
                                {contactInfo?.emails && contactInfo.emails.length > 0 ? (
                                    contactInfo.emails.map((email, i) => (
                                        <p key={i} className="text-gray-600 text-sm leading-relaxed">
                                            <a href={`mailto:${email}`} className='block w-fit h-fit'>{email}</a>
                                        </p>
                                    ))
                                ) : (
                                    <>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            <a href="" className='block w-fit h-fit'> info@amfofana.edu.lr </a>
                                        </p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            <a href="" className='block w-fit h-fit'> info@amfofana.edu.lr </a>
                                        </p>
                                    </>
                                )}
                            </div>

                        </div>

                        {/* Office Hours Card */}
                        <div className="md:bg-white max-md:w-full md:p-8 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 flex flex-col md:items-center items-start md:text-center md:hover:shadow-md transition-shadow">
                            <div className="h-12  max-sm:hidden w-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2857AE] mb-6">
                                <span className='icon icon-clock flex items-center justify-center text-primary h-5 w-5'></span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Office Hours</h3>
                            <p className="text-gray-600 max-md:[&_br]:hidden text-sm leading-relaxed whitespace-pre-line">
                                {contactInfo?.officeHours ? contactInfo.officeHours : (
                                    <>Mon - Fri: 8 AM - 4 PM<br />Sat: 8 AM - 12 PM</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Section: Connect & Map */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Connect With Us */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect With Us</h2>
                                <p className="text-gray-600">
                                    Follow us on social media for updates, news, and student highlights.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex gap-4">
                                    {socialLinks.map((social) => (
                                        <Link
                                            key={social.name}
                                            href={social.href}
                                            className={`icon icon-${social.name} ${social.name === "whatsapp" ? "text-[#25D366]/80 lg:hover:text-[#25D366]" : "text-primary/80 lg:hover:text-primary"} transition-all h-8 w-8 flex items-center justify-center rounded-full border border-transparent duration-500 lg:hover:border-primary/50`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button className="bg-[#2857AE] cursor-pointer hover:bg-[#1e408a] text-white px-8 py-6 rounded-lg text-base font-medium w-full sm:w-auto">
                                        Contact Form
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="sm:max-w-xl w-[calc(100%-2rem)] px-0 overflow-y-auto">
                                    <div className="px-6 py-6 h-full overflow-y-auto">
                                        <SheetHeader className="mb-6 text-left">
                                            <SheetTitle className="text-2xl font-bold text-[#2857AE]">Send us a Message</SheetTitle>
                                            <SheetDescription>
                                                Fill out the form below and our team will get back to you shortly.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Input id="firstName" placeholder="First Name" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} disabled={isSubmitting} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Input id="lastName" placeholder="Last Name" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} disabled={isSubmitting} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Input id="email" type="email" placeholder="E-mail" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={isSubmitting} />
                                            </div>

                                            <div className="space-y-2">
                                                <Input id="subject" placeholder="Inquiry about admissions" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} disabled={isSubmitting} />
                                            </div>

                                            <div className="space-y-2">
                                                <textarea
                                                    id="message"
                                                    className="flex min-h-[120px] max-h-40 w-full rounded-md border border-primary/20 lg:hover:border-primary duration-500 focus:duration-500 focus:border-primary bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Write your message here"
                                                    required
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                    disabled={isSubmitting}
                                                ></textarea>
                                            </div>

                                            <Button type="submit" className="w-full cursor-pointer bg-[#2857AE] hover:bg-[#1e408a] py-6 text-base transition-all" disabled={isSubmitting}>
                                                {isSubmitting ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                                ) : (
                                                    <><Send className="mr-2 h-4 w-4" /> Send Message</>
                                                )}
                                            </Button>
                                        </form>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Map Section */}
                        <div className="bg-blue-50 rounded-3xl h-[400px] w-full relative overflow-hidden flex items-center justify-center border border-blue-100 z-0">
                            <Map lat={contactInfo?.latitude} lng={contactInfo?.longitude} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
