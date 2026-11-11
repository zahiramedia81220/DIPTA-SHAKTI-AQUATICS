import React from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Phone,
  Instagram,
  ExternalLink,
  MessageCircle,
  Clock,
  Mail,
  Shield,
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { settings } = useApp();

  // Safe coordinates with robust defaults to prevent undefined/string toFixed runtime errors
  const lestarindoLat = Number(settings?.lestarindoCoords?.lat ?? -7.530458);
  const lestarindoLng = Number(settings?.lestarindoCoords?.lng ?? 110.587267);
  const frontOneLat = Number(settings?.frontOneCoords?.lat ?? -7.536697);
  const frontOneLng = Number(settings?.frontOneCoords?.lng ?? 110.600952);

  // Clean WhatsApp phone number for wa.me link (replace leading 0 with 62)
  const cleanPhone = (settings?.phoneWa || '0859-5900-4884').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const defaultContactMsg =
    settings?.contactWaMessage ||
    'Halo DS AQUATICS! Saya tertarik untuk mendaftar kelas renang / konsultasi jadwal. Mohon informasinya. Terima kasih!';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultContactMsg)}`;

  const lestarindoMapsUrl = `https://www.google.com/maps?q=${lestarindoLat},${lestarindoLng}`;
  const frontOneMapsUrl = `https://www.google.com/maps?q=${frontOneLat},${frontOneLng}`;

  return (
    <footer className="bg-slate-950 text-white relative overflow-hidden" id="kontak-section">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Col 1: Brand & Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {settings?.clubName || 'DS AQUATICS'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                  Official
                </span>
              </div>
              <p className="text-cyan-400 font-medium text-sm">
                {settings?.slogan || 'Learn to Swim, Learn for Life.'}
              </p>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Klub renang profesional Boyolali dengan metode latihan ramah, menyenangkan, dan berorientasi pada kemajuan teknik serta rasa percaya diri.
              </p>
            </div>

            {/* Quick Contact Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="contact-btn-wa"
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-emerald-400 font-semibold uppercase">
                    WhatsApp Resmi
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {settings.phoneWa}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="contact-btn-ig"
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 hover:text-pink-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-pink-400 font-semibold uppercase">
                    Instagram Official
                  </span>
                  <span className="text-sm font-bold text-white">
                    @dsaquatics.official
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-pink-400 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Col 2 & 3: Two Training Locations with Google Maps Embeds */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span>Lokasi Kolam Latihan Resmi DS AQUATICS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Location 1: Lestarindo Swimming Pool */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Lokasi Utama 1
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Boyolali
                    </span>
                  </div>
                  <h4 className="text-base font-heading font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {settings.lestarindoName}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {settings.lestarindoAddress}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Lat/Lng: {lestarindoLat.toFixed(6)}, {lestarindoLng.toFixed(6)}
                  </p>
                </div>

                {/* Google Map Interactive Embed */}
                <div className="h-36 w-full rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <iframe
                    title="Google Map Lestarindo Swimming Pool"
                    src={`https://maps.google.com/maps?q=${lestarindoLat},${lestarindoLng}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>

                <a
                  href={lestarindoMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-cyan-600 text-xs font-semibold text-white transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Buka Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Location 2: Front One Boutique Adria Boyolali */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Lokasi Utama 2
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Boyolali
                    </span>
                  </div>
                  <h4 className="text-base font-heading font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {settings.frontOneName}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {settings.frontOneAddress}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Lat/Lng: {frontOneLat.toFixed(6)}, {frontOneLng.toFixed(6)}
                  </p>
                </div>

                {/* Google Map Interactive Embed */}
                <div className="h-36 w-full rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <iframe
                    title="Google Map Front One Boutique Adria Boyolali"
                    src={`https://maps.google.com/maps?q=${frontOneLat},${frontOneLng}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>

                <a
                  href={frontOneMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-cyan-600 text-xs font-semibold text-white transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Buka Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Required Footnote */}
        <div className="border-t border-slate-900 pt-8 pb-4 text-center">
          <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide font-heading uppercase print:hidden">
            Copyright 2026 DS AQUATICS | HAK CIPTA DILINDUNGI UNDANG - UNDANG.
          </p>
        </div>
      </div>
    </footer>
  );
};
