'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, BookOpen, Filter } from 'lucide-react';
import api from '@/lib/api';
import type { LearningMaterial } from '@/types/school';

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊',
  xls: '📈', xlsx: '📈', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', mp4: '🎬', default: '📁',
};

function getFileIcon(url?: string) {
  if (!url) return FILE_ICONS.default;
  const ext = url.split('.').pop()?.toLowerCase() || 'default';
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export default function ChildMaterialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api.get(`/parent/children/${id}/materials`)
      .then(r => setMaterials(r.data || []))
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [id]);

  const subjects = ['ALL', ...Array.from(new Set(materials.map(m => m.subject?.name).filter(Boolean) as string[]))];
  const filtered = filter === 'ALL' ? materials : materials.filter(m => m.subject?.name === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <Link href="/parent/children" className="hover:text-primary">Children</Link>
            <span>/</span>
            <Link href={`/parent/children/${id}`} className="hover:text-primary">Profile</Link>
            <span>/</span>
            <span className="text-slate-700">Materials</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Learning Materials</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
          <BookOpen className="w-12 h-12 opacity-30" />
          <p className="font-semibold">No materials available</p>
          <p className="text-xs">Materials uploaded by teachers will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(material => (
            <div
              key={material.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-primary transition-colors duration-300"
            >
              <div className="text-3xl shrink-0">{getFileIcon(material.fileUrl)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{material.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  {material.subject && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">
                      {material.subject.name}
                    </span>
                  )}
                  <span>{new Date(material.createdAt).toLocaleDateString('en-GB')}</span>
                  {material.uploadedBy && (
                    <span>by {material.uploadedBy.firstName || material.uploadedBy.username}</span>
                  )}
                </div>
                {material.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{material.description}</p>
                )}
              </div>
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
