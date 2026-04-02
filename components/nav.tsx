'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'glass-dark shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-primary font-black text-sm">W</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white text-lg font-bold tracking-tight">
                Weekendaa
              </span>
              <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
                Chennai
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/70 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/plan"
              className="ml-3 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-primary font-bold text-sm rounded-xl hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              Plan Weekend
            </Link>
          </div>

          {/* Hamburger button (mobile) */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span
              className={`block h-0.5 w-5 bg-white rounded-full transition-all duration-300 ${
                menuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-white rounded-full transition-all duration-300 ${
                menuOpen ? 'opacity-0 scale-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-white rounded-full transition-all duration-300 ${
                menuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass-dark mx-4 mb-4 rounded-2xl p-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-white/80 hover:text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-white/5 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/plan"
            className="block text-center py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 text-primary font-bold text-sm rounded-xl mt-2"
            onClick={() => setMenuOpen(false)}
          >
            Plan Weekend
          </Link>
        </div>
      </div>
    </nav>
  );
}
