import React from 'react';
import BlogPostDetail from '@/app/pages-sections/blog/BlogPostDetail';
import { fetchBlogPostBySlug } from '@/lib/strapi-api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await fetchBlogPostBySlug(slug);

    if (!post) {
        return notFound();
    }

    return <BlogPostDetail post={post} />;
}
