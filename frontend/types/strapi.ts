// ─────────────────────────────────────────────
// Strapi v5 base wrappers  (flat format – no `attributes` wrapper)
// ─────────────────────────────────────────────

/** Strapi v5 rich-text block (subset we need) */
export interface StrapiRichTextBlock {
   type: string;
   children: Array<{ type: string; text: string }>;
}

export interface StrapiMediaFormat {
   url: string;
   width: number;
   height: number;
}

export interface StrapiMediaItem {
   id: number;
   url: string;
   alternativeText: string | null;
   name: string;
   formats?: {
      thumbnail?: StrapiMediaFormat;
      small?: StrapiMediaFormat;
      medium?: StrapiMediaFormat;
      large?: StrapiMediaFormat;
   };
}

/** Strapi v5 LIST response */
export interface StrapiListResponse<T> {
   data: T[];
   meta: {
      pagination: {
         page: number;
         pageSize: number;
         pageCount: number;
         total: number;
      };
   };
}

/** Strapi v5 SINGLE-TYPE response */
export interface StrapiSingleResponse<T> {
   data: T | null;
   meta: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Collection Types  (v5 flat – fields directly on the object)
// ─────────────────────────────────────────────

/** Shared link-items component shape */
export interface StrapiLinkItem {
   id: number;
   text: string;
   visibled: boolean | null;
}

/** hero-slides collection */
export interface StrapiHeroSlide {
   id: number;
   documentId?: string;
   title: string;
   subtitle: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   cta_primary_label: StrapiLinkItem | null;
   cta_secondary_label: StrapiLinkItem | null;
   sort_order: number;
}

/** blog-posts collection */
export interface StrapiBlogPost {
   id: number;
   documentId?: string;
   title: string;
   excerpt: string;
   /** Rich-text from Strapi v5 (array of blocks) OR plain string */
   content: StrapiRichTextBlock[] | string;
   date: string;
   category: string;
   author: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   slug: string;
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | null;
   }> | null;
}

/** staff-members collection */
export interface StrapiStaffMember {
   id: number;
   documentId?: string;
   name: string;
   role: string;
   email: string;
   bio: string;
   heading: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   is_leadership: boolean;
   is_featured: boolean;
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | null;
   }> | null;
   sort_order: number;
}

/** testimonials collection */
export interface StrapiTestimonial {
   id: number;
   documentId?: string;
   type: string;
   quote: string;
   name: string;
   role: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
}

/** academic-programs collection */
export interface StrapiAcademicProgram {
   id: number;
   documentId?: string;
   title: string;
   category: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   sort_order: number;
   header: string;
   subheader: string;
}

/** gallery-items collection */
export interface StrapiGalleryItem {
   id: number;
   documentId?: string;
   title: string;
   type: 'image' | 'video';
   category: 'Campus' | 'Events' | 'Sports';
   src: StrapiMediaItem | StrapiMediaItem[] | null;
   thumbnail: StrapiMediaItem | StrapiMediaItem[] | null;
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | null;
   }> | null;
}

/** opportunities collection */
export interface StrapiOpportunity {
   id: number;
   documentId?: string;
   index: string;
   title: string;
   header: string;
   subheader: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   published_date: string;
   deadline: string;
   date_number: string;
   slug: string;
   details_intro: string;
   /** New: Matching the Strapi component structure */
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | StrapiMediaItem[] | null;
   }> | null;
   /** Repeatable component: { id, text }[] */
   requirements: Array<{ id: number; text: string }> | null;
   /** Repeatable component: { id, text }[] */
   benefits: Array<{ id: number; text: string }> | null;
   how_to_apply: string;
}

/** academic-sections collection */
export interface StrapiAcademicSection {
   id: number;
   documentId?: string;
   section_id: string;
   title: string;
   content: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   details: Array<{ id: number; text: string }> | null;
   sort_order: number;
   header: string;
   subheader: string;
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | null;
   }> | null;
}

/** academic-resources collection */
export interface StrapiAcademicResource {
   id: number;
   documentId?: string;
   name: string;
   file: StrapiMediaItem | StrapiMediaItem[] | null;
}

/** school-calendars collection */
export interface StrapiSchoolCalendar {
   id: number;
   documentId?: string;
   year: string;
   label: string | null;
   file: StrapiMediaItem | StrapiMediaItem[] | null;
}
// ─────────────────────────────────────────────
// Single Types  (v5 flat)
// ─────────────────────────────────────────────

export interface StrapiAboutPage {
   id: number;
   documentId?: string;
   history_title: string;
   history_body: string;
   history_image: StrapiMediaItem | StrapiMediaItem[] | null;
   stat_students: string;
   stat_years: string;
   stat_programs: string;
   stat_awards: string;
   mission_text: string;
   vision_text: string;
   values: Array<{ title: string; description: string }>;
   principal_name: string;
   principal_role: string;
   principal_message: string;
   principal_image: StrapiMediaItem | StrapiMediaItem[] | null;
   home_heading: string | null;
   home_description: string | null;
   home_stat: string | null;
   home_image_1: StrapiMediaItem | StrapiMediaItem[] | null;
   home_image_2: StrapiMediaItem | StrapiMediaItem[] | null;
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | null;
   }> | null;
}

export interface StrapiContactInfo {
   id: number;
   documentId?: string;
   address: string;
   phones: Array<{ phones: string | number }>;
   email: Array<{ address: string }>;
   office_hours: string;
   latitude?: number;
   longitude?: number;
   social_links: Array<{ name: string; href: string }>;
   breadcrumb_item: Array<{
      id: number;
      breadcrumb_title: string;
      description: string;
      image: StrapiMediaItem | null;
   }> | null;
}

export interface StrapiStudentLife {
   id: number;
   documentId?: string;
   heading: string;
   description: string;
   school_name: string;
   image_1: StrapiMediaItem | StrapiMediaItem[] | null;
   image_2: StrapiMediaItem | StrapiMediaItem[] | null;
   image_3: StrapiMediaItem | StrapiMediaItem[] | null;
   image_4: StrapiMediaItem | StrapiMediaItem[] | null;
}

// ─────────────────────────────────────────────
// Normalised frontend DTOs  (flat, easy to use in components)
// ─────────────────────────────────────────────

export interface HeroSlide {
   id: number;
   title: string;
   subtitle: string;
   description: string;
   image: string;
   ctaPrimaryLabel: string;
   ctaPrimaryVisible: boolean;
   ctaSecondaryLabel: string;
   ctaSecondaryVisible: boolean;
}

export interface BlogPost {
   id: number;
   title: string;
   excerpt: string;
   content: string;  // always plain/HTML string in the DTO
   date: string;
   category: string;
   author: string;
   image: string;
   slug: string;
   breadcrumb_item: BreadcrumbItem[];
}

export interface StaffMember {
   id: number;
   name: string;
   role: string;
   email: string;
   bio: string;
   image: string;
   heading: string;
   isLeadership: boolean;
   isFeatured: boolean;
   breadcrumb_item: BreadcrumbItem[];
}

export interface Testimonial {
   id: number;
   type: string;
   quote: string;
   name: string;
   role: string;
   image: string;
}

export interface FeatureCardData {
   id: number;
   icon: "BookOpen" | "HandHeart" | "Home" | "Star" | "Shield" | "GraduationCap";
   title: string;
   description: string;
}

export interface WhyChooseUsData {
   subtitle: string;
   title: string;
   description: string;
   cards: FeatureCardData[];
}

export interface AcademicProgram {
   id: number;
   title: string;
   category: string;
   description: string;
   image: string;
   sortOrder: number;
   header: string;
   subheader: string;

}

export interface GalleryItem {
   id: number;
   title: string;
   type: 'image' | 'video';
   category: 'Campus' | 'Events' | 'Sports';
   src: string;
   thumbnail?: string;
   breadcrumb_item: BreadcrumbItem[];
}

/** New Breadcrumb Interface */
export interface BreadcrumbItem {
   id: number;
   breadcrumb_title: string;
   description: string;
   imageUrl: string;
}

export interface Opportunity {
   id: number;
   index: string;
   title: string;
   header: string;
   subheader: string;
   description: string;
   image: string;
   publishedDate: string;
   deadline: string;
   dateNumber: string;
   slug: string;
   // Added breadcrumb array
   breadcrumb_item: BreadcrumbItem[];
   details: {
      intro: string;
      requirements: string[];
      benefits: string[];
      howToApply: string;
   };
}

export interface AcademicSection {
   id: number;
   sectionId: string;
   title: string;
   content: string;
   image: string;
   details: string[];
   header: string;
   subheader: string;
   breadcrumb_item: BreadcrumbItem[];
}

export interface AcademicResource {
   id: number;
   name: string;
   fileUrl: string;
}

export interface SchoolCalendar {
   id: number;
   year: string;
   label: string;
   fileUrl: string;
}

export interface AboutPageData {
   historyTitle: string;
   historyBody: string;
   historyImage: string;
   stats: { students: number; years: number; programs: number; awards: number };
   missionText: string;
   visionText: string;
   values: Array<{ title: string; description: string }>;
   principalName: string;
   principalRole: string;
   principalMessage: string;
   principalImage: string;
   homeHeading: string;
   homeDescription: string;
   homeStat: string;
   homeImage1: string;
   homeImage2: string;
   breadcrumb_item: BreadcrumbItem[];
}

export interface ContactInfoData {
   address: string;
   phones: string[];
   emails: string[];
   officeHours: string;
   latitude?: number;
   longitude?: number;
   socialLinks: Array<{ name: string; href: string }>;
   breadcrumb_item: BreadcrumbItem[];
}

export interface StudentLifeData {
   heading: string;
   description: string;
   schoolName: string;
   image1: string;
   image2: string;
   image3: string;
   image4: string;

}

export interface StrapiFeatureCard {
   id: number;
   icon: "BookOpen" | "HandHeart" | "Home" | "Star" | "Shield" | "GraduationCap";
   title: string;
   description: string;
}

export interface StrapiWhyChooseUs {
   id: number;
   documentId?: string;
   subtitle: string;
   title: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   cards: StrapiFeatureCard[];
}

export interface StrapiVideoSection {
   id: number;
   documentId?: string;
   title: string;
   video: StrapiMediaItem | StrapiMediaItem[] | null;
   overlay_subtitle: string;
   overlay_quote: string;
   overlay_author: string;
}

export interface StrapiFooterLink {
   id: number;
   label: string;
   url: string;
}

export interface StrapiFooter {
   id: number;
   documentId?: string;
   logo: StrapiMediaItem | StrapiMediaItem[] | null;
   title: string;
   subtitle: string;
   description: string;
   quick_links: StrapiFooterLink[];
   academics_links: StrapiFooterLink[];
}

export interface StrapiNavSubItem {
   id: number;
   label: string;
   url: string;
   description?: string | null;
}

export interface StrapiNavItem {
   id: number;
   label: string;
   url: string;
   sub_items?: StrapiNavSubItem[] | null;
}

export interface StrapiNavbar {
   id: number;
   documentId?: string;
   logo: StrapiMediaItem | StrapiMediaItem[] | null;
   title: string;
   subtitle: string;
   establishment_date: string;
   nav_items: StrapiNavItem[];
}

export interface FeatureCardData {
   id: number;
   icon: "BookOpen" | "HandHeart" | "Home" | "Star" | "Shield" | "GraduationCap";
   title: string;
   description: string;
}

export interface WhyChooseUsData {
   subtitle: string;
   title: string;
   description: string;
   image: string;
   cards: FeatureCardData[];
}

export interface VideoSectionData {
   title: string;
   video: string;
   overlaySubtitle: string;
   overlayQuote: string;
   overlayAuthor: string;
}

export interface FooterLinkData {
   id: number;
   label: string;
   url: string;
}

export interface FooterData {
   logo: string;
   title: string;
   subtitle: string;
   description: string;
   quickLinks: FooterLinkData[];
   academicsLinks: FooterLinkData[];
}

export interface NavSubItemData {
   id: number;
   label: string;
   url: string;
   description: string | null;
}

export interface NavItemData {
   id: number;
   label: string;
   url: string;
   subItems: NavSubItemData[] | null;
}

export interface NavbarData {
   logo: string;
   title: string;
   subtitle: string;
   establishmentDate: string;
   navItems: NavItemData[];
}
