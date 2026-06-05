export interface GalleryItem {
    id: string;
    type: 'image' | 'video';
    category: 'Campus' | 'Events' | 'Sports';
    src: string;
    thumbnail?: string; // For videos
    title: string;
}

export const galleryItems: GalleryItem[] = [
    // IMAGES
    {
        id: 'img1',
        type: 'image',
        category: 'Sports',
         src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop',
        title: 'Annual Sports Day Victory'
    },
    {
        id: 'img2',
        type: 'image',
        category: 'Campus',
        src: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop',
       title: 'Main Campus Building'
    },
    {
        id: 'img3',
        type: 'image',
        category: 'Events',
        src: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop',
        title: 'Graduation Ceremony 2025'
    },
    {
        id: 'img4',
        type: 'image',
        category: 'Campus',
        src: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=2070&auto=format&fit=crop',
        title: 'Library Reading Corner'
    },
    {
        id: 'img5',
        type: 'image',
        category: 'Events',
        src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop',
        title: 'Cultural Day Celebration'
    },
    {
        id: 'img6',
        type: 'image',
        category: 'Sports',
        src: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop',
        title: 'Football Championship'
    },
    {
        id: 'img7',
        type: 'image',
        category: 'Events',
        src: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop',
        title: 'Graduation Ceremony 2025'
    },

    // VIDEOS (Using placeholders or links)
    {
        id: 'vid1',
        type: 'video',
        category: 'Events',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder video
        thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop',
        title: 'School Tour 2026'
    },
    {
        id: 'vid2',
        type: 'video',
        category: 'Campus',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1969&auto=format&fit=crop',
        title: 'Science Fair Highlights'
    },
      {
        id: 'vid3',
        type: 'video',
        category: 'Events',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder video
        thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop',
        title: 'School Tour 2026'
    },
    {
        id: 'vid4',
        type: 'video',
        category: 'Campus',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1969&auto=format&fit=crop',
        title: 'Science Fair Highlights'
    },
      {
        id: 'vid5',
        type: 'video',
        category: 'Events',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder video
        thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop',
        title: 'School Tour 2026'
    },
    {
        id: 'vid6',
        type: 'video',
        category: 'Campus',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1969&auto=format&fit=crop',
        title: 'Science Fair Highlights'
    },
    {
        id: 'vid7',
        type: 'video',
        category: 'Sports',
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093&auto=format&fit=crop',
        title: 'Basketball Finals'
    }
];
