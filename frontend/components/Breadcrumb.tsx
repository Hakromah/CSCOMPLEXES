"use client";
import React from 'react';
// Import your custom StrapiImage instead of next/image
import StrapiImage from './StrapiImage';

interface BreadcrumbProps {
    title: string;
    description?: string;
    image: string;
    alt?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, description, image, alt = "Breadcrumb background" }) => {
    return (
        <section className="relative h-fit md:h-[clamp(350px,50vh,501px)] flex items-center justify-center">
            <div className="absolute w-full h-full inset-0">
                {/* Use StrapiImage here to handle the Strapi Cloud URL */}
                <StrapiImage
                    src={image}
                    alt={alt}
                    fill
                    className="object-cover h-full w-full object-center"
                    unoptimized
                />
                <div className="absolute inset-0 bg-black/60" />
            </div>

            <div className="relative z-10 container max-md:py-[clamp(50px,20vh,80px)] max-w-1920 mx-auto px-[clamp(20px,3vw,100px)] text-center text-white">
                <div className="flex items-center justify-center w-full gap-2.5">
                    <a href="/" className="text-white/50 md:hover:text-white duration-500">Home</a>
                    <span>/</span>
                    <p className=''>{title}</p>
                </div>
                <h1 className="text-[clamp(1.5rem,3vw,4rem)] md:text-5xl font-bold mb-4 font-sans">{title}</h1>
                {description && (
                    <p className="text-[clamp(1rem,3vw,1.2rem)] lg:max-w-2xl mx-auto font-light">
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
};

export default Breadcrumb;

// import React from 'react';
// import Image from 'next/image';

// interface BreadcrumbProps {
//     title: string;
//     description?: string;
//     image: string;
//     alt?: string;
// }

// const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, description, image, alt = "Breadcrumb background" }) => {
//     return (
//         <section className="relative h-fit md:h-[clamp(350px,50vh,501px)] flex items-center justify-center">
//             <div className="absolute w-full h-full inset-0">
//                 <Image src={image}
//                     alt={alt}
//                     fill
//                     className="object-cover h-full w-full object-center"
//                     priority
//                 />
//                 <div className="absolute inset-0 bg-black/60" />
//             </div>
//             <div className="relative z-10  container max-md:py-[clamp(50px,20vh,80px)] max-w-1920 mx-auto  px-[clamp(20px,3vw,100px)] text-center text-white">
//                 <div className="flex items-center justify-center w-full gap-2.5">
//                     <a href="index.html" className="text-white/50 md:hover:text-white duration-500">Home</a> / <p className=''>{title}</p>
//                 </div>
//                 <h1 className="text-[clamp(1.5rem,3vw,4rem)] md:text-6xl font-bold mb-4 font-sans">{title}</h1>
//                 {description && (
//                     <p className="text-[clamp(1rem,3vw,1.2rem)]  lg:max-w-2xl mx-auto font-light">
//                         {description}
//                     </p>
//                 )}
//             </div>
//         </section>
//     );
// };

// export default Breadcrumb;
