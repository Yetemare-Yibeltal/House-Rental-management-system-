import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Grid } from 'lucide-react';

const imgUrl = (img) => img?.url || img?.secureUrl || '';

const PropertyImageGallery = ({ images = [], title = '' }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const close = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setLightboxIndex((i) => (i + 1) % images.length);

  if (!images.length) {
    return (
      <div className="w-full h-72 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center">
        <span className="text-5xl">🏠</span>
      </div>
    );
  }

  const [cover, ...rest] = images;
  const side = rest.slice(0, 4);

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden" style={{ height: 360 }}>
          <div className={`relative cursor-pointer group ${side.length > 0 ? 'col-span-2 row-span-2' : 'col-span-4 row-span-2'}`} onClick={() => setLightboxIndex(0)}>
            <img src={imgUrl(cover)} alt={`${title} - main`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <ZoomIn size={20} className="absolute top-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {side.map((img, i) => (
            <div key={i} className="relative overflow-hidden cursor-pointer group" onClick={() => setLightboxIndex(i + 1)}>
              <img src={imgUrl(img)} alt={`${title} - ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <span className="text-white text-xl font-bold">+{images.length - 5}</span>
                  <span className="text-gray-300 text-xs">more photos</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <button onClick={() => setLightboxIndex(0)} className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-lg hover:bg-black/90 transition-colors">
            <Grid size={12} /> View all {images.length} photos
          </button>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={close}>
            <button onClick={close} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"><X size={18} /></button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 rounded-full text-white text-sm">{lightboxIndex + 1} / {images.length}</div>
            {images.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft size={20} /></button>
            )}
            <img src={imgUrl(images[lightboxIndex])} alt={`${title} - ${lightboxIndex + 1}`} className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
            {images.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight size={20} /></button>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }} className={`w-12 h-8 rounded overflow-hidden border-2 flex-shrink-0 transition-all ${i === lightboxIndex ? 'border-yellow-400' : 'border-transparent opacity-60'}`}>
                  <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PropertyImageGallery;
