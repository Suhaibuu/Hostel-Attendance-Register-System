import { motion } from 'framer-motion';

export default function TopBar({ title, subtitle, rightContent }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-5 h-[64px] shrink-0 shadow-sm">
      {/* Left — Logo + Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: -3 }}
          className="shrink-0 p-1 bg-slate-50 border border-slate-200/40 rounded-xl"
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
            className="shrink-0" 
          />
        </motion.div>
        <div className="min-w-0">
          <h1 className="text-sm font-black text-slate-800 truncate tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Content slots */}
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
        </div>
      )}
    </header>
  );
}
