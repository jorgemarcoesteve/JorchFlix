import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { MediaCard } from './MediaCard';

export function MediaRow({ titulo, subtitulo, items, tipo, link, icon: Icon }) {
  const rowRef = useRef(null);
  const scrollRef = useRef(null);
  const { scrollXProgress } = useScroll({ container: scrollRef });

  const despIzquierda = () => {
    scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  };

  const despDerecha = () => {
    scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 relative" ref={rowRef}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-5 px-4"
      >
        <div>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-jf-verde/10">
                <Icon className="text-jf-verde" size={20} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{titulo}</h2>
              {subtitulo && (
                <p className="text-sm text-jf-muted mt-0.5">{subtitulo}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {link && (
            <Link
              to={link}
              className="text-sm text-jf-verde hover:text-jf-verde-claro transition-colors font-medium"
            >
              Ver todo →
            </Link>
          )}
          <button
            onClick={despIzquierda}
            className="p-2 rounded-xl glass text-jf-muted hover:text-white hover:bg-white/10 transition-all"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={despDerecha}
            className="p-2 rounded-xl glass text-jf-muted hover:text-white hover:bg-white/10 transition-all"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </motion.div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.slice(0, 20).map((item, i) => (
          <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
            <MediaCard item={item} tipo={tipo} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
