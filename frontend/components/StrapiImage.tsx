"use client";
import NextImage, { type ImageProps } from "next/image";

const STRAPI_URL =
   process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1338";

/**
 * Drop-in replacement for next/image that:
 * 1. Automatically sets `unoptimized` for Strapi localhost images
 *    (bypasses Next.js private-IP restriction in dev).
 * 2. Renders a neutral placeholder when src is empty/null so pages
 *    never crash when a Strapi item has no image uploaded yet.
 */
export default function StrapiImage({ src, ...props }: ImageProps) {
   const srcStr = typeof src === "string" ? src : "";

   // Render a placeholder for missing images instead of passing "" to next/image
   if (!srcStr) {
      return (
         <div
            className={`bg-gray-200 flex items-center justify-center text-gray-400 text-sm ${props.className ?? ""}`}
            style={props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }}
            aria-label={typeof props.alt === "string" ? props.alt : "No image"}
         >
            No image
         </div>
      );
   }

   // const isStrapiSrc = srcStr.startsWith(STRAPI_URL) || srcStr.includes("localhost:1338");
   const isStrapiSrc =
      srcStr.includes("strapiapp.com") ||
      srcStr.includes(":1338") ||
      srcStr.includes(STRAPI_URL) ||
      srcStr.startsWith("/"); // relative paths

   return <NextImage src={src} {...props} unoptimized={isStrapiSrc || !!props.unoptimized} />;
}
