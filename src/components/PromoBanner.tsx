import React from 'react';
import { Sparkles, Bike, ShieldCheck, Tag } from 'lucide-react';
import bannerImg from '../assets/images/banner_sweets_1_1786819988690.jpg';

export const PromoBanner: React.FC = () => {
  return (
    <section className="mb-6 rounded-2xl overflow-hidden shadow-sm relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white p-4 sm:p-5">
      {/* Background Image with subtle overlay */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
        <img src={bannerImg} alt="Banner background" className="w-full h-full object-cover" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">
            <Sparkles size={12} className="text-amber-200" />
            Special Deals Everyday
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            FREE DELIVERY <span className="text-amber-200">above ₹199</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/90 font-medium max-w-md">
            Fresh handcrafted traditional Indian sweets & hot fast food delivered straight to your door!
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
            <Bike size={18} className="text-amber-300" />
            <div className="text-left">
              <div className="text-[10px] text-white/80 uppercase font-semibold">Fast Delivery</div>
              <div className="text-xs font-bold">30-45 mins</div>
            </div>
          </div>
          <div className="bg-white text-red-700 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md uppercase tracking-wider">
            100% Pure Veg
          </div>
        </div>
      </div>
    </section>
  );
};
