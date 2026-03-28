import type { Metadata } from 'next';
import './globals.css';
import DarkModeToggle from '@/components/DarkModeToggle';

export const metadata: Metadata = {
  title: 'InternHunt - Internship Tracker',
  description: 'Personal internship dashboard for CS students looking for tech internships in India & Remote',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                  InternHunt &#x1F3AF;
                </a>
                <div className="hidden md:flex items-center gap-4">
                  <a href="/" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">
                    Dashboard
                  </a>
                  <a href="/saved" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">
                    Saved
                  </a>
                  <a href="/settings" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">
                    Settings
                  </a>
                </div>
              </div>
              <DarkModeToggle />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-around h-14">
            <a href="/" className="flex flex-col items-center text-xs text-gray-600 dark:text-gray-400">
              <span>&#x1F3E0;</span> Home
            </a>
            <a href="/saved" className="flex flex-col items-center text-xs text-gray-600 dark:text-gray-400">
              <span>&#x1F516;</span> Saved
            </a>
            <a href="/settings" className="flex flex-col items-center text-xs text-gray-600 dark:text-gray-400">
              <span>&#x2699;&#xFE0F;</span> Settings
            </a>
          </div>
        </nav>
      </body>
    </html>
  );
}
