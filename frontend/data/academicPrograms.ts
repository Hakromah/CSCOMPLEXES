export const programSlugs = [
    'kindergarten',
    'elementary',
    'junior-high',
    'senior-high',
    'vocational-training',
];

export const programsData: Record<string, {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    contentImage: string;
    highlights: string[];
    curriculum: { subject: string; desc: string }[];
}> = {
    'kindergarten': {
        title: 'Kindergarten',
        subtitle: 'Laying the Foundation for Lifelong Learning',
        description: 'Our Kindergarten program focuses on "Learning through Play." We prioritize social-emotional development, basic literacy, and numeracy in a safe, nurturing environment. Children are encouraged to explore, inquire, and discover the world around them.',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Play-based learning curriculum',
            'Early literacy & numeracy skills',
            'Development of fine and gross motor skills',
            'Creative arts and music integration'
        ],
        curriculum: [
            { subject: 'Language Arts', desc: 'Phonics, vocabulary, and early reading comprehension activities.' },
            { subject: 'Mathematics', desc: 'Number sense, basic operations, shapes, patterns, and problem-solving.' },
            { subject: 'Science', desc: 'Exploration of the natural world, basic scientific concepts, and observation.' },
            { subject: 'Social & Emotional Learning', desc: 'Understanding community, self, relationships, and emotional regulation.' }
        ]
    },
    'elementary': {
        title: 'Elementary',
        subtitle: 'Building Strong Academic Foundations',
        description: 'Our Elementary program builds a strong foundation in core subjects through inquiry-based learning. Students develop critical thinking, collaboration, and communication skills in a supportive and engaging environment.',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Inquiry-based learning approach',
            'Strong focus on literacy and numeracy',
            'Safe and nurturing environment',
            'Character development programs'
        ],
        curriculum: [
            { subject: 'Language Arts', desc: 'Reading comprehension, creative writing, grammar, and vocabulary enrichment.' },
            { subject: 'Mathematics', desc: 'Arithmetic operations, fractions, geometry, and logical reasoning.' },
            { subject: 'Science & Technology', desc: 'Hands-on experiments, environmental studies, and introduction to technology.' },
            { subject: 'Social Studies', desc: 'History, geography, civics, and cultural awareness.' }
        ]
    },
    'junior-high': {
        title: 'Junior High',
        subtitle: 'Preparing for Academic Excellence',
        description: 'Our Junior High program introduces students to specialized subjects, lab sciences, and organizational skills that foster independence. Students are guided to develop their unique talents while building a solid academic foundation.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Specialized subject teachers',
            'Introduction to lab sciences',
            'Development of organizational skills',
            'Extracurricular enrichment activities'
        ],
        curriculum: [
            { subject: 'Advanced Sciences', desc: 'Biology, Chemistry, and Physics with hands-on laboratory work.' },
            { subject: 'Mathematics', desc: 'Algebra, geometry, statistics, and pre-calculus foundations.' },
            { subject: 'Languages & Literature', desc: 'English literature, creative writing, and foreign language introduction.' },
            { subject: 'Arts & Technology', desc: 'Visual arts, music, computer science, and digital literacy.' }
        ]
    },
    'senior-high': {
        title: 'Senior High',
        subtitle: 'Excellence in Higher Education Preparation',
        description: 'Our Senior High program offers Advanced Placement (AP) courses, Honors tracks, and College & Career Readiness programs. Students are prepared for university admissions and beyond with rigorous academics and leadership opportunities.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Advanced Placement (AP) courses',
            'College & Career Readiness programs',
            'Leadership opportunities',
            'University admissions guidance'
        ],
        curriculum: [
            { subject: 'AP Courses', desc: 'College-level coursework in various subjects for advanced learners.' },
            { subject: 'STEM Programs', desc: 'Advanced mathematics, engineering, and technology projects.' },
            { subject: 'Humanities', desc: 'Advanced literature, history, philosophy, and social sciences.' },
            { subject: 'Career Readiness', desc: 'Internship programs, career counseling, and professional skills development.' }
        ]
    },
    'vocational-training': {
        title: 'Vocational Training',
        subtitle: 'Skills for the Real World',
        description: 'Our Vocational Training program equips students with practical, industry-relevant skills. Through hands-on workshops, apprenticeships, and real-world projects, students gain the expertise needed to thrive in their chosen career paths.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80',
        contentImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        highlights: [
            'Hands-on skills training',
            'Industry-relevant curriculum',
            'Apprenticeship opportunities',
            'Entrepreneurship development'
        ],
        curriculum: [
            { subject: 'Technical Skills', desc: 'Practical workshops in automotive, electrical, woodworking, and construction.' },
            { subject: 'Information Technology', desc: 'Web development, networking, hardware maintenance, and software skills.' },
            { subject: 'Business & Entrepreneurship', desc: 'Business planning, financial literacy, marketing, and management.' },
            { subject: 'Agriculture & Environment', desc: 'Modern farming techniques, sustainability practices, and environmental stewardship.' }
        ]
    },
};
