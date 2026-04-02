import type { Metadata } from "next";
import "./globals.css";
import Nav from "../components/nav";
import Footer from "../components/footer";

export const metadata: Metadata = {
  title: "Weekendaa — Chennai Weekend Planner",
  description: "Plan your Chennai weekend. Dodge the traffic. Zero cost. Real-time traffic intelligence for residents of Chennai.",
  keywords: ["Chennai", "weekend planner", "traffic", "things to do", "free", "Weekendaa"],
  openGraph: {
    title: "Weekendaa — Chennai Weekend Planner",
    description: "Plan your Chennai weekend. Dodge the traffic. Zero cost.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekendaa — Chennai Weekend Planner",
    description: "Plan your Chennai weekend. Dodge the traffic. Zero cost.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased bg-sand text-gray-900">
        <Nav />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
