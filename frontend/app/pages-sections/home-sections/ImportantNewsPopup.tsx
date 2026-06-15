"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";

export default function ImportantNewsPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Small delay before showing the popup for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Important News</DialogTitle>
          <DialogDescription>School announcements</DialogDescription>
        </DialogHeader>
        <div
          className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer shadow-2xl bg-white flex items-center justify-center"
          onClick={() => handleOpenChange(false)}
        >
          <Image
            src="/announcement-mockup-v2.jpg"
            alt="Important News Announcement"
            fill
            className="object-cover"
            priority
          />
          <button
            className="group absolute top-4 right-4 bg-primary/70 h-[21px] w-[21px] cursor-pointer flex items-center justify-center overflow-hidden duration-300 text-white rounded-[6px] p-2 lg:hover:bg-primary z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenChange(false);
            }}
            aria-label="Close"
          >
            <svg className="lg:group-hover:rotate-90 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
