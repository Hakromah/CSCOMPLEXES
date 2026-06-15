/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
//import Image from "next/image";
//import { Button } from "@/components/ui/button";
import { Phone, ChevronDown, Landmark, Copy, Check, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import StrapiImage from "@/components/StrapiImage";
import type { NavbarData, ContactInfoData } from "@/types/strapi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const socialLinks = [
  { name: "facebook", href: "#" },
  { name: "instagram", href: "#" },
  { name: "x", href: "#" },
  { name: "youtube", href: "#" },
  { name: "tiktok", href: "#" },
  { name: "whatsapp", href: "https://wa.me/231880386681" },
];

interface NavbarProps {
  navbarData?: NavbarData | null;
  contactInfo?: ContactInfoData | null;
}

export default function Navbar({ navbarData, contactInfo }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const pathname = usePathname();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const isPortal = pathname?.startsWith('/student') || pathname?.startsWith('/teacher') || pathname?.startsWith('/admin');
  const lastScrollY = useRef(0);
  const isScrolledRef = useRef(false);
  const isVisibleRef = useRef(true);
  const headerRef = useRef<HTMLElement>(null);

  // Use Strapi nav items if present, otherwise fallback to default
  const baseNavItems = navbarData?.navItems?.length ? navbarData.navItems : [
    { name: "Accueil", href: "/" },
    {
      name: "À propos",
      href: "/about",
      subItems: [
        {
          name: "Qui sommes-nous",
          href: "/about",
          description: "Découvrez notre héritage d'excellence depuis 1990",
        },
        {
          name: "Personnel et direction",
          href: "/staff",
          description: "Rencontrez l'équipe qui guide notre succès",
        },
      ],
    },
    { name: "Blog", href: "/blog" },
    {
      name: "Académique",
      href: "/academic",
      subItems: [
        {
          name: "Académique",
          href: "/academic",
          description: "Découvrez nos programmes éducatifs",
        },
        { 
          icon: <User className="w-4 h-4 mr-2 inline-block" />,
          name: "Connexion au portail",
          href: "/login",
          description: "Connectez-vous pour accéder à votre espace",
        },
      ],
    },
    { name: "Galerie", href: "/gallery" },
    { name: "Opportunités", href: "/opportunities" },
  ];

  const rawNavItems = [...baseNavItems, { name: "Contact", href: "/contact", label: "Contact" }];
  const navItems = rawNavItems.map((item: any) => {
    let name = item.name || item.label;
    if (name === "Home" || name === "Accueil") name = "Accueil";
    if (name === "About" || name === "À propos") name = "À propos";
    if (name === "Academic" || name === "Académique") name = "Académique";
    if (name === "Gallery" || name === "Galerie") name = "Galerie";
    if (name === "Opportunities" || name === "Opportunités") name = "Opportunités";
    
    let subItems = item.subItems?.map((sub: any) => {
      let subName = sub.name || sub.label;
      let subIcon = sub.icon;
      
      if (subName === "About Us" || subName === "Qui sommes-nous") { 
          subName = "Qui sommes-nous"; 
      }
      if (subName === "Staff & Leadership" || subName === "Personnel et direction") { 
          subName = "Personnel et direction"; 
      }
      if (subName === "Academic" || subName === "Académique") { 
          subName = "Académique"; 
      }
      if (subName === "Portal Login" || subName === "Connexion au portail" || sub.href === "/login" || subName === "login") { 
          subName = "Connexion au portail"; 
          subIcon = <User className="w-4 h-4 mr-2 inline-block shrink-0" />;
      }
      return { ...sub, name: subName, label: subName, icon: subIcon };
    });

    return { ...item, name, label: name, subItems };
  });

  // Merge social links from contactInfo or default array
  const socials = contactInfo?.socialLinks ?? socialLinks;

  useEffect(() => {
    const updateHeaderTransform = () => {
      if (!headerRef.current) return;
      if (!isVisibleRef.current) {
        headerRef.current.style.transform = 'translateY(-100%)';
      } else if (isScrolledRef.current) {
        headerRef.current.style.transform = 'translateY(-37px)';
      } else {
        headerRef.current.style.transform = 'translateY(0)';
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      let changed = false;

      // Top nav: hide when scrolled past 20px, show at very top
      if (currentScrollY > 100 && !isScrolledRef.current) {
        isScrolledRef.current = true;
        changed = true;
      } else if (currentScrollY <= 40 && isScrolledRef.current) {
        isScrolledRef.current = false;
        changed = true;
      }

      // Whole header: hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        if (isVisibleRef.current) { isVisibleRef.current = false; changed = true; }
      } else {
        if (!isVisibleRef.current) { isVisibleRef.current = true; changed = true; }
      }

      if (changed) updateHeaderTransform();
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      const newState = !prev;

      if (!newState) {
        setMobileSubmenu(null); // reset submenu when closing
      }

      return newState;
    });
  };

  const toggleMobileSubmenu = (itemName: string) => {
    setMobileSubmenu(mobileSubmenu === itemName ? null : itemName);
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-350 w-full border-b bg-white transition-transform duration-500 ${isPortal ? 'max-md:hidden' : ''}`}
    >
      <div className="w-full h-full ">
        <div
          className="topNav w-full bg-[#2857AE] flex items-center  h-[37px]"
        >
          <div className="w-full flex justify-between items-center py-3 container px-5 md:px-[clamp(20px,5vw,60px)] mx-auto max-w-[1920px]">
            <div>
              <p className="text-white text-sm font-normal">
                {navbarData?.establishmentDate || "Est. February 20 1990"}
              </p>
            </div>
            <div className="social-media flex items-center space-x-[clamp(10px,2vw,18px)]">
              {socials.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className={`icon icon-${social.name} ${social.name === "whatsapp" ? "text-[#25D366]/80 lg:hover:text-[#25D366]" : "text-white/80 lg:hover:text-white"} transition-all h-5 w-5 flex items-center justify-center rounded-full`}
                ></Link>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full flex h-[calc(var(--header-height)-37px)] items-center px-5 md:px-[clamp(20px,5vw,60px)] relative container mx-auto max-w-[1920px]">
          <div className="w-full h-full flex justify-between items-center">
            <Link
              href="/"
              className="mr-6 h-full flex items-center space-x-2 z-50 relative"
            >
              <div className="flex items-center max-xs:gap-2 gap-4">
                {/* Dynamic Logo */}
                <div className="relative w-10 h-10 md:w-[57px] md:h-[57px]">
                  <StrapiImage
                    src={navbarData?.logo || "/logo/2cslogo.jpeg"}
                    alt="2 CS Complexes Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h2 className="text-[18px] xl:text-[clamp(18px,2.5vw,24px)] font-semibold text-primary mb-[-3px]">
                    {navbarData?.title || "2 CS COMPLEXES"}
                  </h2>
                  <p className=" text-[12px] md:text-[8px] xl:text-[clamp(9px,1.2vw,12px)] text-black tracking-widest uppercase">
                    {navbarData?.subtitle || "Islamic & English High School"}
                  </p>
                </div>
              </div>
            </Link>

            {/* Unified Menu Wrapper */}
            <div
              className={`
                        menu-wrapper
                        absolute top-full left-0 w-full
                        flex flex-col md:flex-row items-center max-md:bg-primary gap-5 lg:gap-10
                        transition-all duration-300 ease-in-out
                        md:static md:w-auto md:h-full md:pointer-events-auto md:opacity-100
                        ${isMobileMenuOpen
                  ? "max-md:h-[calc(100vh-80px)] max-md:opacity-100 max-md:pointer-events-auto max-md:border-b max-md:shadow-xl max-md:overflow-y-auto"
                  : "max-md:h-0 max-md:opacity-0 max-md:pointer-events-none max-md:border-b-0 max-md:shadow-none md:p-0 max-md:overflow-hidden"
                }
                    `}
            >


              <nav className="flex flex-col md:flex-row md:h-full items-start md:items-center w-full md:w-auto md:gap-5 text-sm font-medium ">
                {navItems.map((item: any) => (
                  <div
                    key={item.label || item.name}
                    className="group w-full md:w-auto flex flex-col md:flex-row md:h-full md:items-center relative md:static"
                  >
                    <div className="flex items-center md:h-full  justify-between w-full md:w-auto md:justify-start gap-1">
                      {item.subItems ? (
                        <div className="group/sub relative h-full max-md:h-auto max-md:w-full max-md:border-b max-md:border-white/50">
                          <div
                            className="text-foreground/60 h-auto max-md:w-full md:h-full flex items-center justify-between w-full md:w-auto transition-colors hover:text-foreground/80 py-3 md:py-0 relative cursor-pointer max-md:px-5"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleMobileSubmenu(item.label || item.name);
                            }}
                          >
                            <div className="relative max-md:text-white  text-[18px] md:text-[16px] xl:text-[clamp(17px,3vw,18px)] h-full flex items-center md:before:absolute md:before:bottom-0 md:before:left-0 md:before:w-0 md:before:h-0.5 md:before:bg-primary md:before:transition-all md:before:duration-300 md:hover:before:w-full md:hover:before:duration-500 md:hover:text-[#2857AE]">
                              {item.label || item.name}
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform max-md:text-white duration-300 ml-1 ${mobileSubmenu === (item.label || item.name) ? "rotate-180" : ""} md:group-hover:rotate-180`}
                            />
                          </div>
                          <div
                            className={`
                                           gap-from-15 gap-to-20 z-100! grid md:grid-cols-1  scale-100 opacity-100
                                           max-md:grid-rows-[0fr] duration-500
                                            md:group-not-[&:hover]/sub:scale-90
                                            md:group-not-[&:hover]/sub:opacity-0
                                              md:group-hover/sub:opacity-100
                                              md:group-hover/sub:pointer-events-auto
                                              md:group-hover/sub:scale-100
                                            md:group-not-[&:hover]/sub:pointer-events-none
                                             md:group-hover/sub:delay-200
                                              relative max-md:w-full
                                               md:absolute md:top-full
                                                md:w-[277px] md:z-150 md:left-1/2 h-full md:-translate-x-1/2
                                            ${mobileSubmenu === (item.label || item.name) ? "max-md:grid max-md:grid-rows-[1fr] max-md:opacity-100 max-md:mt-2 max-md:relative max-md:h-full max-md:w-full" : "max-md:grid max-md:grid-rows-[0fr] max-md:opacity-0 max-md:mt-0 max-md:px-0 max-md:w-full"}

                                        `}
                          >
                            <div className="h-full w-full max-md:overflow-hidden md:bg-white md:relative md:rounded-bl-[10px] md:shadow-sm md:rounded-br-[10px]">
                              <div className="flex flex-col max-md:w-full h-full md:p-5 md:gap-2 max-md:gap-px">
                                {item.subItems.map((sub: any) => (
                                  <Link
                                    key={sub.label || sub.name}
                                    href={sub.url || sub.href}
                                    className="group/item cursor-pointer relative md:bg-primary/4 md:pr-[35px] w-full flex justify-between items-center max-md:bg-white py-2 md:py-3 md:px-[18px] duration-500 md:hover:text-primary md:rounded-lg md:hover:bg-primary/10 transition-colors max-md:px-5"

                                    onClick={() => {
                                      setIsMobileMenuOpen(false);
                                      setMobileSubmenu(null);
                                    }}

                                  >
                                    <div className="flex items-center">
                                        {sub.icon && sub.icon}
                                        {sub.label || sub.name}
                                    </div>

                                    <div className="w-[25px] max-md:hidden h-[25px] absolute right-3 duration-500 scale-75 group-hover/item:scale-100 group-hover/item:opacity-100 opacity-0 top-1/2 -translate-y-1/2 bg-primary rounded-full flex justify-center items-center">
                                      <svg
                                        className="w-2.5 h-2.5 scale-75 duration-500 group-hover/item:scale-100 group-hover/item:opacity-100 origin-center opacity-0"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 13 13"
                                        fill="none"
                                      >
                                        <path
                                          d="M12.3136 0.999966C12.3136 0.447681 11.8659 -3.44143e-05 11.3136 -3.39928e-05L2.31363 -3.38664e-05C1.76135 -3.42035e-05 1.31363 0.447681 1.31363 0.999966C1.31363 1.55225 1.76135 1.99997 2.31363 1.99997L10.3136 1.99997L10.3136 9.99997C10.3136 10.5523 10.7613 11 11.3136 11C11.8659 11 12.3136 10.5523 12.3136 9.99997L12.3136 0.999966ZM0.707031 11.6066L1.41414 12.3137L12.0207 1.70707L11.3136 0.999966L10.6065 0.292859L-7.55191e-05 10.8995L0.707031 11.6066Z"
                                          fill="white"
                                        />
                                      </svg>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={item.url || item.href}
                          className="text-foreground/60 h-auto cursor-pointer md:h-full max-md:w-full   max-md:border-b max-md:border-white/50 flex items-center transition-colors hover:text-foreground/80 py-3 md:py-0 relative"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="relative h-full max-md:text-white text-[18px] md:text-[16px] xl:text-[clamp(17px,3vw,18px)] flex items-center md:before:absolute md:before:bottom-0 max-md:px-5 md:before:left-0 md:before:w-0 md:before:h-0.5 md:before:bg-primary md:before:transition-all md:before:duration-300 md:hover:before:w-full md:hover:before:duration-500 md:hover:text-[#2857AE]">
                            {item.label || item.name}
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="flex flex-col md:flex-row w-full md:w-auto gap-5 items-center mt-4 md:mt-0 max-md:px-5">
                <a
                  href={`tel:${contactInfo?.phones?.[0]?.replace(/\s+/g, '') || '+1234567890'}`}
                  className="text-foreground/60 h-auto md:h-full transition-colors hover:text-foreground/80 hidden md:flex items-center"
                >
                  <div className="relative h-full flex items-center">
                    <Phone className="h-5 w-5" />
                  </div>
                </a>

                <div className="w-full md:w-auto max-md:text-primary rounded-full max-md:bg-white">
                  <Dialog onOpenChange={(open) => { if (open) setIsMobileMenuOpen(false); }}>
                    <DialogTrigger asChild>
                      <button
                        className="w-full h-full py-3 px-5 text-nowrap flex items-center justify-center transition-colors max-md:text-primary max-md:bg-white lg:hover:bg-primary/10 lg:hover:text-primary bg-primary border border-primary/0 lg:hover:border-primary text-white duration-500 rounded-full text-sm font-medium cursor-pointer"
                      >
                        Faire un don
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Informations Bancaires</DialogTitle>
                        <DialogDescription>
                          Merci pour votre soutien. Voici nos coordonnées bancaires pour effectuer un don.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-0 py-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                          <div className="flex items-center gap-4 p-4">
                            <Landmark className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">Banque</p>
                              <p className="text-sm text-slate-500">Nom de la banque</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 hover:bg-slate-100 transition-colors group">
                            <div className="h-5 w-5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">Nom du compte</p>
                              <p className="text-sm text-slate-500">2 CS COMPLEXES</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard('2 CS COMPLEXES', 'name')}
                              className="p-2 bg-white shadow-sm border border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/30 rounded-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Copier"
                            >
                              {copiedItem === 'name' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-4 p-4 hover:bg-slate-100 transition-colors group">
                            <div className="h-5 w-5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">IBAN / RIB</p>
                              <p className="text-sm text-slate-500 font-mono">XX00 0000 0000 0000 0000 00</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard('XX00 0000 0000 0000 0000 00', 'iban')}
                              className="p-2 bg-white shadow-sm border border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/30 rounded-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Copier"
                            >
                              {copiedItem === 'iban' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Hamburger Button */}
            <div className="hidden w-fit h-fit max-md:flex justify-center items-center">
              <div
                onClick={toggleMobileMenu}
                className="
                        hamburger-menu group/burger relative cursor-pointer flex flex-col justify-between w-[26px] h-[18px]
                       "
              >
                <span
                  className={`
                        ${isMobileMenuOpen
                      ? "bg-(--color-primary) relative  duration-300 translate-y-2 h-0.5 rotate-45 opacity-100"
                      : "bg-(--color-primary) h-0.5 relative opacity-100 duration-300"
                    }
                    `}
                ></span>
                <span
                  className={`
                        ${isMobileMenuOpen
                      ? "bg-(--color-primary) relative  duration-300 opacity-0 h-0.5"
                      : "bg-(--color-primary) h-0.5 relative opacity-100 duration-300"
                    }
                    `}
                ></span>
                <span
                  className={`
                        ${isMobileMenuOpen
                      ? "bg-(--color-primary) relative  duration-300 -translate-y-2 h-0.5 -rotate-45 opacity-100"
                      : "bg-(--color-primary) h-0.5 relative opacity-100 duration-300"
                    }
                    `}
                ></span>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
