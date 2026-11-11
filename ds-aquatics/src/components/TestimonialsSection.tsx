import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Star, MessageSquareQuote, Sparkles } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const { testimonials } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), testimonials.length - 1);
  const currentItem = testimonials[safeIndex] || testimonials[0];

  if (!currentItem) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-20 bg-white border-b border-slate-100 relative overflow-hidden" id="testimonial-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
            <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" />
            <span>Kata Orang Tua & Member</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight">
            Testimonial & Pengalaman Berlatih
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Cerita nyata dari wali murid dan siswa yang telah merasakan manfaat berenang bersama DS AQUATICS.
          </p>
        </div>

        {/* Carousel Container with Left and Right Navigation Buttons */}
        <div className="relative max-w-4xl mx-auto">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            id="testi-btn-prev"
            className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white shadow-xl border border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-300 flex items-center justify-center transition-all active:scale-95 group"
            aria-label="Previous Testimonial"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            id="testi-btn-next"
            className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white shadow-xl border border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-300 flex items-center justify-center transition-all active:scale-95 group"
            aria-label="Next Testimonial"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Active Testimonial Card */}
          <div className="bg-gradient-to-br from-slate-50 to-cyan-50/40 rounded-3xl p-8 sm:p-12 border border-cyan-100 shadow-xl relative overflow-hidden card-3d">
            <div className="absolute top-6 right-8 text-cyan-200/50">
              <MessageSquareQuote className="w-24 h-24 stroke-1" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Star Rating */}
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(currentItem.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-base sm:text-xl lg:text-2xl text-slate-800 font-medium leading-relaxed italic">
                "{currentItem.quote}"
              </blockquote>

              {/* Author & Role */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-heading font-black text-lg flex items-center justify-center shadow-md">
                    {currentItem.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-slate-900 text-base">
                      {currentItem.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-cyan-700 font-semibold">
                      {currentItem.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-8 h-2.5 bg-cyan-600'
                    : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
