export interface Opportunity {
    id: string;
    index: string; // "01", "02", etc.
    title: string;
    description: string;
    image: string;
    publishedDate: string;
    deadline: string;
    dateNumber: string; // "03 2026" for sorting
    details: {
        intro: string;
        requirements: string[];
        benefits: string[];
        howToApply: string;
    };
}

export const opportunities: Opportunity[] = [
    {
        id: "comprehensive-education-scholarship",
        index: "01",
        title: "Empowering students with comprehensive education and innovative learning approaches",
        description: "Our curriculum is designed to meet national education standards and global best practices. We connect outstanding students with local and international scholarship opportunities.",
         image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop",
       publishedDate: "January 03 2026",
        deadline: "January",
        dateNumber: "03 2026",
        details: {
            intro: "The Comprehensive Education Scholarship acts as a bridge for students who demonstrate exceptional academic potential but face financial barriers. This program is not just about funding; it's about creating a support system that nurtures talent and fosters leadership.",
            requirements: [
                "Must be a current student or applicant to AMFOFANA High School.",
                "Minimum GPA of 3.5 or equivalent.",
                "Demonstrated financial need.",
                "Two letters of recommendation from former teachers.",
                "A 500-word personal statement on career goals."
            ],
            benefits: [
                "Full tuition coverage for one academic year.",
                "Coverage for textbooks and uniform costs.",
                "Mentorship from alumni and industry professionals.",
                "Access to exclusive leadership workshops."
            ],
            howToApply: "Fill out the application form by clicking the 'Apply Now' button. Ensure you have all digital copies of your transcripts and recommendation letters ready for upload."
        }
    },
    {
        id: "stem-excellence-program",
        index: "02",
        title: "STEM Excellence Program: Bridging the Gap in Science and Technology",
        description: "Join our specialized STEM track designed to prepare future engineers, doctors, and scientists. Features hands-on lab work and coding bootcamps.",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop",
        publishedDate: "February 15 2026",
        deadline: "March",
         dateNumber: " 30 2026",
        details: {
            intro: "The STEM Excellence Program is an intensive track for students passionate about Science, Technology, Engineering, and Mathematics. We provide state-of-the-art lab access and partnerships with local tech firms.",
            requirements: [
                "Strong grades in Mathematics and Science subjects.",
                "Completion of an entrance project or quiz.",
                "Commitment to after-school lab sessions."
            ],
            benefits: [
                "Priority access to science labs and computer rooms.",
                "Free participation in regional science fairs.",
                "Internship opportunities with partner tech companies.",
                "Specialized coding and robotics workshops."
            ],
            howToApply: "Submit your project portfolio alongside the standard application form. Interviews will be conducted for shortlisted candidates."
        }
    },
    {
        id: "arts-and-culture-grant",
        index: "03",
        title: "Arts & Culture Grant: Unleashing Creative Potential",
        description: "For students with a flair for the arts, music, and drama. This grant supports creative endeavors and exhibitions.",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
        publishedDate: "March 10 2026",
        deadline: "April",
        dateNumber: "20 2026",
      
        details: {
            intro: "We believe in the power of expression. The Arts & Culture Grant provides materials, studio time, and exhibition space for students excelling in visual arts, music, or performing arts.",
            requirements: [
                "Portfolio of artwork or recording of performance.",
                "Letter of intent describing your artistic vision.",
                "Availability for school cultural events."
            ],
            benefits: [
                "Grant of $500 for art supplies or instrument maintenance.",
                "Featured spot in the Annual School Exhibition.",
                "One-on-one coaching with visiting artists."
            ],
            howToApply: "Submit a digital portfolio link or upload samples via the application portal."
        }
    }
];
