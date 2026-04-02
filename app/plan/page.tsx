'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PreferenceBuilder from '../../components/preference-builder';
import { UserPrefs } from '../../types';

export default function PlanPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async (prefs: UserPrefs) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/itinerary/${id}`);
      } else {
        const encoded = btoa(JSON.stringify(prefs));
        router.push(`/itinerary/${encoded}`);
      }
    } catch {
      const encoded = btoa(JSON.stringify(prefs));
      router.push(`/itinerary/${encoded}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand -mt-16">
      <div className="hero-gradient text-white pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="section-label text-amber-400/80 mb-2">Build your plan</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 animate-fade-in">
            Plan Your Weekend
          </h1>
          <p className="text-white/40 text-sm max-w-md mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
            Tell us what you&apos;re in the mood for. We&apos;ll build a traffic-smart itinerary.
          </p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10 pb-16">
        <PreferenceBuilder onGenerate={handleGenerate} isGenerating={isGenerating} />
      </div>
    </div>
  );
}
