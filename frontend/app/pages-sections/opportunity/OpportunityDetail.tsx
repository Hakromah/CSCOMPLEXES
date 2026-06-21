"use client";
import StrapiImage from "@/components/StrapiImage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { Opportunity } from "@/types/strapi";

export default function OpportunityDetail({
  opportunity,
}: {
  opportunity: Opportunity;
}) {

  const applied = opportunity.applyNow;

  return (
    <div className="min-h-screen bg-white sm:pb-[clamp(25px,3vw,80px)]">
      {/* Header / Hero */}
      <div className="relative h-[50vh] min-h-[400px]">
        <StrapiImage
          src={opportunity.image}
          alt={opportunity.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-end container mx-auto px-4 pb-12 text-white">
          <div className="flex items-center gap-4 max-sm:flex-wrap text-sm font-medium mb-4">
            <span className="bg-primary px-3 py-1 rounded-full">
              {opportunity.index}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Publié le :{" "}
              {opportunity.publishedDate}
            </span>
            <span className="flex items-center gap-1 text-red-200">
              <Clock className="w-4 h-4" /> Date limite :{" "}
              <div>
                Date limite {opportunity.deadline}{" "}
                <span className="text-white">{opportunity.dateNumber}</span>
              </div>
            </span>
          </div>
          <h1 className="text-xl md:text-5xl font-bold max-w-4xl leading-tight">
            {opportunity.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-5 md:px-[clamp(20px,5vw,60px)] py-[clamp(25px,3vw,80px)] max-w-[1920px]">
        <div className="flex flex-col lg:flex-row gap-[clamp(20px,3.5vw,60px)]">
          {/* Main Text */}
          <div className="flex-1 space-y-10">
            <Link
              href="/opportunities"
              className="inline-flex items-center text-white duration-500 bg-primary py-2 px-5 rounded-full lg:hover:text-primary lg:hover:bg-white border border-primary/0 lg:hover:border-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux opportunités
            </Link>
            <div className="prose prose-lg max-w-none text-gray-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Overview
              </h3>
              <p className="leading-relaxed mb-6">
                {opportunity.details.intro}
              </p>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {opportunity.admissionReq}
              </h3>
              <ul className="space-y-3 mb-6">
                {opportunity.details.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Avantages
              </h3>
              <ul className="space-y-3 mb-6">
                {opportunity.details.benefits.map((ben, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Comment s'appliquer
              </h3>
              <p className="leading-relaxed bg-blue-50 p-6 rounded-xl border border-blue-100">
                {opportunity.details.howToApply}
              </p>
            </div>
          </div>

          {/* Sidebar / CTA */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-2">
                {opportunity.readyToApply}
              </h3>
              <p className="text-gray-500 mb-8 text-sm">
                {opportunity.dontMiss}{" "}
                {opportunity.deadline}.
              </p>

              {applied ? (
                <a href={applied.href} target="_blank" rel="noreferrer" className="w-full block">
                  <Button className="w-full bg-primary hover:bg-[#1e408a] py-6 text-lg shadow-blue-500 shadow-xl">
                    {applied.name}
                  </Button>
                </a>
              ) : (
                  <a href="/contact" rel="noreferrer" className="w-full block">
                  <Button className="w-full bg-primary hover:bg-[#1e408a] py-6 text-lg shadow-blue-500 shadow-xl">
                    Faire une demande
                  </Button>
                </a>
               
              )}


              <div className="mt-6 text-center text-xs text-gray-400">
                {opportunity.byApplying}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
