import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShoppingBag,
  MessageCircle,
  Sparkles,
  ExternalLink,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { SwimGearProduct } from '../types';

interface SwimGearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwimGearModal: React.FC<SwimGearModalProps> = ({ isOpen, onClose }) => {
  const { swimGear, settings } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  if (!isOpen) return null;

  const categories = [
    'Semua',
    ...Array.from(new Set((swimGear || []).map((g) => g && g.category).filter(Boolean) as string[])),
  ];

  const filteredGear =
    selectedCategory === 'Semua'
      ? swimGear || []
      : (swimGear || []).filter((g) => g && g.category === selectedCategory);

  const cleanPhone = (settings?.phoneWa || '0859-5900-4884').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const handleOrder = (product: SwimGearProduct) => {
    let template =
      settings.gearWaTemplate ||
      'Halo Admin DS AQUATICS🙌 Saya berminat membeli produk perlengkapan renang berikut:\n\n*{productName}*\n• Kategori: {category}\n• Harga: {price}\n\nApakah stok masih tersedia? Terima kasih!';
    const text = template
      .replace(/{productName}/g, product.name)
      .replace(/{category}/g, product.category)
      .replace(/{price}/g, product.formattedPrice);
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center-safe justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-cyan-100 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-cyan-200 text-xs font-bold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>Katalog Resmi DS AQUATICS</span>
          </div>
          <h3 className="text-2xl font-heading font-black text-white">
            Perlengkapan Renang & Aksesoris Latihan
          </h3>
          <p className="text-xs sm:text-sm text-cyan-100 mt-1 max-w-2xl">
            Peralatan renang original standar klub renang. Nyaman, awet, dan mendukung akselerasi latihan siswa.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap pl-2">
            Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGear.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-cyan-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.stockStatus}
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-cyan-800 backdrop-blur-xs">
                      {item.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-heading font-bold text-slate-900 text-base group-hover:text-cyan-700 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.description}
                    </p>

                    {item.specifications && item.specifications.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {item.specifications.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                            <span>{spec}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Harga</span>
                    <span className="font-heading font-black text-cyan-700 text-base">
                      {item.formattedPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOrder(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Pesan via WA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Barang dapat diambil langsung saat sesi latihan di kolam renang atau dikirim.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
