import React from "react";
import StrapiImage from "@/components/StrapiImage";
import Breadcrumb from "@/components/Breadcrumb";
import LeadershipSlider from "./LeadershipSlider";
import type { AboutPageData, StaffMember } from "@/types/strapi";
import AnimatedCounter from "@/components/AnimatedCounter";

interface AboutPageProps {
  aboutData?: AboutPageData | null;
  leadershipTeam?: StaffMember[];
}

// Default value cards if Strapi returns no values
const defaultValues = [
  {
    title: "Dual Curriculum",
    description: "A unique English academic system perfectly combined with a strong, deep-rooted Islamic education for a balanced life.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
  },
  {
    title: "Discipline & Values",
    description: "We nurture respect, responsibility, and leadership in every student.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
  },
  {
    title: "Safe Learning Environment",
    description: "A supportive and secure campus where every student feels seen, heard, and valued.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  },
];

export default function AboutPage({ aboutData, leadershipTeam }: AboutPageProps) {
  const stats = aboutData?.stats;

  const values = aboutData?.values && aboutData.values.length > 0 ? aboutData.values : null;
  const breadcrumbData = aboutData?.breadcrumb_item?.[0];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div id="intro">
        <Breadcrumb
          title={breadcrumbData?.breadcrumb_title || "About us"}
          description={breadcrumbData?.description || "Discover Our History, Mission, and Vision"}
          image={breadcrumbData?.imageUrl || "/home/intro1.png"}
          alt={breadcrumbData?.breadcrumb_title || "About Us Hero"}
        />
      </div>

      {/* History Section */}
      <section id="history" className="py-[clamp(25px,3vw,80px)] bg-white">
        <div className="container max-w-[1920px] mx-auto px-5 md:px-[clamp(20px,5vw,60px)] ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(20px,3vw,40px)] items-center">
            <div className="space-y-[clamp(15px,2vw,20px)] [&_p]:font-normal [&_p]:text-black/70 [&_p]:leading-relaxed [&_p]:text-[clamp(16px,2vw,18px)] [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold [&_:is(h1,h2,h3,h4,h5,h6)]:leading-normal [&_:is(h1,h2,h3,h4,h5,h6)]:text-[clamp(18px,2vw,32px)] [&_:is(h1,h2,h3,h4,h5,h6)]:text-primary">
              <h2>{aboutData?.historyTitle || "Our History"}</h2>
              {aboutData?.historyBody
                ? aboutData.historyBody.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))
                : (
                  <>
                    <p>A.M. FOFANA Islamic &amp; English High School was founded in February 1990 by the late Alhaji Sheikh Mohammed Mustapha Fofana. It began with a vision to provide a blended education that integrates Islamic moral values with modern academic excellence.</p>
                    <p>Starting with a few students in a modest structure, the school has grown over decades into a reputable institution graduating thousands of students who excel in various fields while upholding their faith and integrity.</p>
                  </>
                )
              }
            </div>
            <div className="relative h-[400px] w-full bg-gray-200 rounded-2xl overflow-hidden shadow-xl">
              <StrapiImage
                src={aboutData?.historyImage || "/home/intro1.png"}
                alt="School History"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>


        {/* new counter */}
           {/* Statistics Section */}
        <div className="w-full h-full  mt-[clamp(25px,3vw,50px)] lg:px-5">
          <div className="container mx-auto w-full h-full max-w-[1308px] py-[clamp(25px,3vw,50px)] px-[clamp(20px,3vw,100px)] bg-primary/10 lg:rounded-[clamp(10px,2vw,20px)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[clamp(20px,3vw,30px)] text-center">
              {/* Stat 1 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#2857AE] rounded-lg flex items-center justify-center mb-4 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <AnimatedCounter to={stats?.students || 1500} suffix="+" duration={2} className="text-2xl font-bold text-gray-900" />
                <p className="text-gray-600 font-medium">Students</p>
              </div>
              {/* Stat 2 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#2857AE] rounded-lg flex items-center justify-center mb-4 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <AnimatedCounter to={stats?.years || 40} suffix="+" duration={2.5} className="text-2xl font-bold text-gray-900" />
                <p className="text-gray-600 font-medium">Years Excellence</p>
              </div>
              {/* Stat 3 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#2857AE] rounded-lg flex items-center justify-center mb-4 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <AnimatedCounter to={stats?.programs || 15} suffix="+" duration={3} className="text-2xl font-bold text-gray-900" />
                <p className="text-gray-600 font-medium">Programs</p>
              </div>
              {/* Stat 4 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#2857AE] rounded-lg flex items-center justify-center mb-4 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 0-1.125-1.125h-2.25a1.125 1.125 0 0 0-1.125 1.125v9.75" />
                  </svg>
                </div>
                <AnimatedCounter to={stats?.awards || 20} suffix="+" duration={2.5} className="text-2xl font-bold text-gray-900" />
                <p className="text-gray-600 font-medium">Awards</p>
              </div>
            </div>
          </div>
        </div>
        {/* end counter */}
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="py-[clamp(25px,3vw,40px)] bg-primary/20">
        <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-[clamp(20px,3vw,30px)]">
            <div className="bg-white p-[clamp(15px,3vw,40px)] rounded-[clamp(15px,3vw,20px)] shadow-sm max-sm:w-full">
              <div className="w-12 h-12 bg-linear-to-br from-primary to-[#15346F] rounded-lg mb-[clamp(20px,3vw,25px)] flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {aboutData?.missionText || "To provide a comprehensive education that nurtures the intellectual, spiritual, and moral development of our students."}
              </p>
            </div>
            <div className="bg-white p-[clamp(15px,3vw,40px)] rounded-[clamp(15px,3vw,20px)] shadow-sm">
              <div className="w-12 h-12 bg-linear-to-br from-primary to-[#15346F] rounded-lg mb-6 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {aboutData?.visionText || "To be a leading institution of learning that produces well-rounded individuals who excel in both religious and secular knowledge."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-[clamp(25px,3vw,80px)] bg-background">
        <div className="container mx-auto w-full max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
          <div className="text-center mb-12">
            <h2 className="text-[clamp(20px,3vw,40px)] font-bold text-[#2857AE]">Our Core Value</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(values || defaultValues).map((val, i) => (
              <div key={i} className="group rounded-[clamp(15px,2vw,20px)] p-[clamp(15px,3vw,30px)] shadow-lg transition-all duration-300 hover:-translate-y-2 bg-[linear-gradient(180deg,#FFFFFF_0%,#E8F1FF_25%,#6a93e0_100%)] border border-blue-100/50">
                <div className="flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2857AE] to-[#15346F] rounded-lg flex items-center justify-center mb-6 text-white shadow-md">
                    {/* Use default icons for Strapi values (no icon field), or default icon set */}
                    {defaultValues[i % defaultValues.length]?.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{val.title}</h3>
                  <div className="w-full h-[1px] bg-white/30 mb-4"></div>
                  <p className="text-white text-[15px] leading-relaxed font-medium opacity-95">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principal's Message Section */}
      <section className="py-[clamp(25px,3vw,80px)] bg-[#2857AE]">
        <div className="container mx-auto max-w-[1920px] w-full px-5 md:py-10 md:px-[clamp(20px,5vw,60px)]">
          <div className="flex flex-col md:flex-row items-center gap-[clamp(20px,3vw,40px)]">
            <div className="w-full md:w-1/3">
              <div className="relative h-[400px] w-full rounded-[clamp(15px,2vw,20px)] overflow-hidden border-4 border-white/20 shadow-2xl">
                <StrapiImage
                  src={aboutData?.principalImage || "/home/staff2.png"}
                  alt={aboutData?.principalName || "Principal"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            <div className="w-full md:w-2/3 text-white">
              <h2 className="text-[clamp(20px,3vw,32px)] font-bold mb-[clamp(16px,3vw,25px)]">Principal&apos;s Message</h2>
              <div className="space-y-6 text-lg leading-relaxed opacity-90">
                {aboutData?.principalMessage
                  ? aboutData.principalMessage.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                  : (
                    <p>&quot;Education is not merely about acquiring knowledge; it is about building character, nurturing faith, and preparing young minds to contribute positively to society.&quot;</p>
                  )
                }
              </div>
              <div className="mt-[clamp(15px,3vw,30px)]">
                <h3 className="text-[clamp(20px,3vw,32px)] font-semibold text-white">
                  {aboutData?.principalName || "Dr. Ibrahim Kamara"}
                </h3>
                <p className="text-white/70 text-sm mt-1 uppercase tracking-wider">
                  {aboutData?.principalRole || "Principal, A.M. FOFANA High School"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Slider */}
      <LeadershipSlider leadershipTeam={leadershipTeam} />

    </div>
  );
}
