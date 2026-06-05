"use client";
import React, { useState, useMemo } from 'react';
import StrapiImage from '@/components/StrapiImage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import type { BlogPost } from '@/types/strapi';

interface BlogPageProps {
    initialPosts?: BlogPost[];
}

export default function BlogPage({ initialPosts = [] }: BlogPageProps) {
    const [visibleCount, setVisibleCount] = useState(6);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const postWithBreadcrumb = initialPosts.find(p => p.breadcrumb_item && p.breadcrumb_item.length > 0);
    const breadcrumbData = postWithBreadcrumb?.breadcrumb_item?.[0];

    // Auto-generate categories from blog data (future-proof)
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(initialPosts.map(post => post.category))];
        return ['All', ...uniqueCategories];
    }, [initialPosts]);

    // Filter posts by search + category
    const filteredPosts = useMemo(() => {
        return initialPosts.filter(post => {
            const matchesSearch = searchQuery === '' ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = activeCategory === 'All' || post.category === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [initialPosts, searchQuery, activeCategory]);

    // Reset visible count when filters change
    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        setVisibleCount(6);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setVisibleCount(6);
    };
    return (
        <div className="w-full bg-[#E8F1FF]/30 min-h-screen">
            {/* Header */}
            <Breadcrumb
                title={breadcrumbData?.breadcrumb_title || "School News & Updates"}
                description={breadcrumbData?.description || "Stay informed about the latest happenings, achievements, and stories from the AMFOFANA community."}
                image={breadcrumbData?.imageUrl || "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop"}
                alt={breadcrumbData?.breadcrumb_title || "Blog Header"}
            />
            <section className="py-[clamp(25px,3vw,60px)]">
                <div className="container mx-auto px-5 md:px-[clamp(20px,3vw,80px)]">
                    <div className="flex flex-col lg:flex-row gap-[clamp(20px,3vw,50px)]">
                        {/* Main Content */}
                        <div className="w-full lg:w-2/3 max-lg:order-2">
                            <h2 className="text-[clamp(20px,3vw,50px)] font-bold text-gray-900 mb-8">
                                {activeCategory === 'All' ? 'Latest Posts' : activeCategory}
                                {searchQuery && <span className="text-base font-normal text-gray-500 ml-3">({filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''})</span>}
                            </h2>

                            {filteredPosts.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-gray-500 text-lg">No posts found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                        className="mt-4 text-[#2857AE] font-medium hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {filteredPosts.slice(0, visibleCount).map((post) => (
                                        <article key={post.id} className="flex flex-col group">
                                            {/* Image Container */}
                                            <Link href={`/blog/${post.slug}`} className="block relative h-64 w-full rounded-2xl overflow-hidden mb-5">
                                                <StrapiImage
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                {/* Arrow Button */}
                                                <div className="absolute top-4 right-4 bg-[#2857AE] w-10 h-10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </Link>

                                            {/* Content */}
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-sm mb-2 font-medium">
                                                    <span className="text-gray-900">{post.date}</span>
                                                    <span className="text-[#2857AE]">•</span>
                                                    <span className="text-[#2857AE]">{post.category}</span>
                                                </div>

                                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-[#2857AE] transition-colors">
                                                    <Link href={`/blog/${post.slug}`}>
                                                        {post.title}
                                                    </Link>
                                                </h3>

                                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                                    {post.excerpt}
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            {/* Load More Button */}
                            {visibleCount < filteredPosts.length && (
                                <div className="mt-[clamp(30px,3vw,60px)] flex justify-center">
                                    <Button
                                        onClick={() => setVisibleCount(prev => prev + 6)}
                                        className="bg-[#2857AE] hover:bg-[#1f448c] cursor-pointer text-white px-8 py-6 rounded-full text-base font-medium">
                                        Load More
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-1/3 max-lg:order-1">
                            <div className="sticky top-24 space-y-8">
                                {/* Search Widget */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Search for news</h3>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by title or content..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            className="w-full pl-10 pr-4 py-3 bg-[#EEF2F6] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2857AE]/20 transition-all"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => { setSearchQuery(''); setVisibleCount(6); }}
                                                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Categories Widget */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => handleCategoryChange(category)}
                                                className={`px-5 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer ${activeCategory === category
                                                    ? 'bg-[#2857AE] text-white'
                                                    : 'bg-[#EEF2F6] text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

