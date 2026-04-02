'use client';

import Link from 'next/link';

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'Plan', href: '/plan' },
  { label: 'Explore', href: '/explore' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary to-primary-light">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="section-label text-amber-400/80 mb-3">Ready for the weekend?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Plan your perfect Chennai weekend
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-lg mx-auto">
            Traffic-smart itineraries, curated spots, real-time updates.
            All free, built for people who live in Chennai.
          </p>
          <Link
            href="/plan"
            className="inline-block btn-primary text-lg"
          >
            Start Planning
          </Link>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-[#0A0F1A] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <span className="text-primary font-black text-xs">W</span>
              </div>
              <div>
                <span className="text-white/90 font-bold text-sm">Weekendaa</span>
                <span className="text-white/30 text-xs ml-2">Chennai Weekend Planner</span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Credit */}
            <p className="text-white/25 text-xs">
              Made for Chennai
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
