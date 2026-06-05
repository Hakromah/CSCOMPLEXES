import React from "react";
import BlogPage from "@/app/pages-sections/blog/page";
import type { Metadata } from "next";
import { fetchBlogPosts } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Blog",
};

export default async function Page() {
    const { posts } = await fetchBlogPosts({ pageSize: 100 });
    return <BlogPage initialPosts={posts} />;
}
