/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StrapiImage from '@/components/StrapiImage';
import type { FooterData, ContactInfoData } from '@/types/strapi';
import api from '@/lib/api';
import { toast } from 'sonner';

const fallbackSocialLinks = [
  { name: "facebook", href: "#" },
  { name: "instagram", href: "#" },
  { name: "x", href: "#" },
  { name: "youtube", href: "#" },
  { name: "tiktok", href: "#" },
  { name: "whatsapp", href: "https://wa.me/231880386681" },
];

interface FooterProps {
  footerData?: FooterData | null;
  contactInfo?: ContactInfoData | null;
}

export default function Footer({ footerData, contactInfo }: FooterProps) {
  const socialLinks = contactInfo?.socialLinks ?? fallbackSocialLinks;

  const [email, setEmail] = React.useState('');
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !agreed) return;

    setIsSubscribing(true);
    const tid = toast.loading("Subscribing...");

    try {
      await api.post('/newsletter-subscriptions', {
        data: { email }
      });
      toast.success("Successfully subscribed to our newsletter!", { id: tid });
      setEmail('');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 400 && err.response?.data?.error?.message?.includes('unique')) {
        toast.error("This email is already subscribed!", { id: tid });
      } else {
        toast.error("Failed to subscribe. Please try again.", { id: tid });
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#394995] text-white pt-[clamp(20px,3vw,60px)] pb-[clamp(20px,3vw,40px)]">
      <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">

        {/* Top Section: Logo & Subscription */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:mb-[clamp(20px,3vw,40px)] pb-[clamp(20px,3vw,25px)]">
          <div className="flex items-center gap-4">
            {/* Placeholder Logo */}
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <StrapiImage
                src={footerData?.logo || "/logo/2cslogo.jpeg"}
                alt="2 CS Complexes Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{footerData?.title || "A.M. FOFANA"}</h2>
              <p className="text-xs md:text-sm text-white/80 tracking-widest uppercase">{footerData?.subtitle || "Islamic & English High School"}</p>
            </div>
          </div>

          {/* Subscription Form */}
          <div className="w-full max-w-md space-y-2">
            <form onSubmit={handleSubscribe} className="bg-white rounded-lg p-2 flex">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre e-mail"
                disabled={isSubscribing}
                required
                className="border-0 bg-transparent text-black focus-visible:ring-0 placeholder:text-gray-400"
              />
              <Button
                type="submit"
                disabled={isSubscribing || !agreed}
                className="bg-[#394995] hover:bg-[#1e4287] disabled:opacity-50 text-white px-6 py-2 rounded-md transition-all"
              >
                {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : "S'abonner"}
              </Button>
            </form>
            {/* Consent */}
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-white cursor-pointer"
              />
              <span className="text-white/60 text-xs leading-relaxed group-hover:text-white/80 transition-colors">
                J&apos;accepte la{" "}
                <Link href="/legal" className="underline underline-offset-2 text-white/80 hover:text-white transition-colors">
                  politique de confidentialité
                </Link>{" "}
                et consens à recevoir des communications de 2 CS Complexes.
              </span>
            </label>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid max-xs:grid-cols-1 grid-cols-2 sm:grid-cols-4 md:grid-cols-4 max-lg:py-5 max-lg:pb-4 lg:grid-cols-5 gap-[clamp(20px,3.5vw,50px)] lg:gap-8  border-t border-white/20">

          {/* Column 1: About */}
          <div className="space-y-6 lg:col-span-2 lg:py-5">
            <p className="text-white/80 text-sm leading-relaxed max-w-sm whitespace-pre-line">
              {footerData?.description || "Serving the community of Monrovia since 1977. We believe that education is the ultimate key to unlocking a bright future."}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-white/60">{footerData?.followUs || "Suivez-nous sur les réseaux sociaux"}</p>
              <div className="flex gap-2 max-md:gap-2 pt-1">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className={`icon icon-${social.name} ${social.name === "whatsapp" ? "text-[#25D366]/80 lg:hover:text-[#25D366]" : "text-white/80 lg:hover:text-white"} transition-all h-8 w-8 flex items-center justify-center rounded-full border border-transparent duration-500 lg:hover:border-white/50`}
                  >
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-1 lg:border-l max-xs:hidden border-white/20 lg:flex lg:justify-center">
            <div className="lg:py-5 lg:px-5">
              <h3 className="text-xl font-bold mb-6">{footerData?.quickLink || "Liens rapides"}</h3>
              <ul className="space-y-4 max-sm:space-y-2 text-white/80 text-sm">
                {(footerData && footerData.quickLinks.length > 0) ? footerData.quickLinks.map(link => (
                  <li key={link.id}><Link href={link.url} className="hover:text-white transition-colors">{link.label}</Link></li>
                )) : (
                  <>
                    <li><Link href="#" className="hover:text-white transition-colors">Conditions d'admission</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Frais de scolarité</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Actualités de l'école</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Galerie</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Opportunités</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Column 3: Academics */}
          <div className="lg:col-span-1 lg:border-l max-xs:hidden border-white/20 lg:flex lg:justify-center">
            <div className="lg:py-5 lg:px-5">
              <h3 className="text-xl font-bold mb-6">{footerData?.academicLink || "Academic Links"}</h3>
              <ul className="space-y-4 max-sm:space-y-2 text-white/80 text-sm">
                {(footerData && footerData.academicsLinks.length > 0) ? footerData.academicsLinks.map(link => (
                  <li key={link.id}><Link href={link.url} className="hover:text-white transition-colors">{link.label}</Link></li>
                )) : (
                  <>
                    <li><Link href="#" className="hover:text-white transition-colors">Programme d'études</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Calendrier scolaire</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Programmes</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Bourses d'études</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Column 4: Contact Us */}
          <div className="lg:col-span-1 lg:border-l border-white/20 lg:flex lg:justify-center">
            <div className="lg:py-5 lg:px-5">
              <h3 className="text-xl font-bold mb-6">{footerData?.contactUs || "Nous contacter"}</h3>
              <div className="space-y-4 max-sm:space-y-2 text-white/80 text-sm leading-relaxed whitespace-pre-line">
                <p>{footerData?.addressText || "Conakry, Guinée,\nRue 1, 2 Complexes."}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-[clamp(10px,3vw,32px)] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {footerData?.allRight || "2CS SCOLAIRE"}. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="text-xs text-white/50 hover:text-white/80 transition-colors">
              Mentions légales
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <Link href="/legal#collecte-donnees" className="text-xs text-white/50 hover:text-white/80 transition-colors">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
