"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import type { ImportantNewsPopupData } from "@/types/strapi";

const SESSION_KEY = "important_news_popup_seen";

interface Props {
  popupData: ImportantNewsPopupData | null;
}

export default function ImportantNewsPopup({ popupData }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Don't show if Strapi has no data configured
    if (!popupData?.imageUrl) return;

    // Don't show again if already seen this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay before showing for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [popupData]);

  const handleClose = () => {
    // Mark as seen for this browser session so it won't reappear
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsOpen(false);
  };

  // Don't render anything if there's no data from Strapi
  if (!popupData?.imageUrl) return null;

  const content = (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer shadow-2xl bg-white flex items-center justify-center"
      onClick={popupData.link ? undefined : handleClose}
    >
      {popupData.link ? (
        <a
          href={popupData.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          onClick={handleClose}
        >
          <Image
            src={popupData.imageUrl}
            alt="Important News Announcement"
            fill
            className="object-cover"
            priority
          />
        </a>
      ) : (
        <Image
          src={popupData.imageUrl}
          alt="Important News Announcement"
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Close button */}
      <button
        className="group absolute top-4 right-4 border border-white bg-primary h-[40px] w-[40px] cursor-pointer flex items-center justify-center overflow-hidden duration-300 text-white rounded-[6px] p-2 lg:hover:bg-primary z-10"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="Close"
      >
        <svg
          className="lg:group-hover:rotate-90 transition-all duration-300"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Important News</DialogTitle>
          <DialogDescription>School announcements</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
