import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Problems } from './components/Problems';
import { Solutions } from './components/Solutions';
import { Features } from './components/Features';
import { Roadmap } from './components/Roadmap';
import { Dashboard } from './components/Dashboard';
import { Stats } from './components/Stats';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { RoadmapGenerator } from './components/RoadmapGenerator';

export default function App() {
  const [showRoadmapGenerator, setShowRoadmapGenerator] = useState(false);

  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  if (showRoadmapGenerator) {
    return <RoadmapGenerator onBack={() => setShowRoadmapGenerator(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Dashboard />
        <Problems />
        <Solutions />
        <Features />
        <Roadmap onGenerateClick={() => setShowRoadmapGenerator(true)} />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}