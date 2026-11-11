import React from 'react';
import { useApp } from '../context/AppContext';
import { Camera, Calendar } from 'lucide-react';

export const DocumentationSection: React.FC = () => {
  const { documentation } = useApp();

  // Safely guard and duplicate the list so it smoothly loops infinitely in marquee
  const safeDocs = (documentation || []).filter((d) => d && d.id);
  const loopedDocs = safeDocs.length > 0 ? [...safeDocs, ...safeDocs] : [];

  return (
    <section className="py-16 bg-white overflow-hidden border-b border-slate-100" id="dokumentasi-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 mb-2">
              <Camera className="w-3.5 h-3.5 text-cyan-600" />
              <span>Galeri & Dokumentasi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">
              Aktivitas Latihan & Keceriaan Kolam
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-xl">
              Dokumentasi latihan renang privat, reguler, dan grup prestasi DS AQUATICS.
            </p>
          </div>
        </div>
      </div>

      {/* Marquee Carousel moving from right to left (60 seconds per loop) */}
      <div className="relative w-full overflow-hidden select-none">
        {/* Soft edge gradient fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="animate-marquee-60s flex gap-6 px-4">
          {loopedDocs.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="w-[280px] sm:w-[340px] shrink-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-400 transition-all duration-300 group flex flex-col"
            >
              {/* Image Container with 16:10 aspect */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-200">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/70 text-white backdrop-blur-xs flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-cyan-300" />
                  <span>{item.date}</span>
                </div>
              </div>

              {/* Caption & Description */}
              <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
                <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-cyan-700 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-cyan-700 font-semibold">
                  <span>DS Aquatics Official</span>
                  <span className="text-slate-400">#LearnToSwim</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
