import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles, TrendingUp, ChevronLeft, ChevronRight, PhoneCall, ArrowRight, Award, Zap, Lock } from 'lucide-react';

interface Slide {
  id: number;
  badge: string;
  title: string;
  highlightText: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  onSecondaryClick?: () => void;
  icon: React.ElementType;
  gradient: string;
  statNumber: string;
  statLabel: string;
}

interface HeroSliderProps {
  onOpenContact?: () => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onOpenContact }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: Slide[] = [
    {
      id: 0,
      badge: 'Transparent AI Engine',
      title: 'Alternative Digital Footprint',
      highlightText: 'Credit Scoring System',
      description: 'Evaluate true creditworthiness for credit-invisible individuals using payment regularity, mobile recharges & SHAP explainability.',
      ctaText: 'Calculate Credit Score',
      ctaLink: '/credit-score',
      secondaryCtaText: 'View Sample Users',
      secondaryCtaLink: '/sample-users',
      icon: ShieldCheck,
      gradient: 'from-red-950 via-slate-950 to-red-950',
      statNumber: '300–900',
      statLabel: 'Standardized CIBIL Scale',
    },
    {
      id: 1,
      badge: 'AI Twin Simulator',
      title: 'Project Your Future Health With',
      highlightText: 'Financial Twin AI',
      description: 'Simulate 1-year, 3-year, and 5-year compounding wealth trajectories under optimized financial habits and micro-investments.',
      ctaText: 'Explore Financial Twin',
      ctaLink: '/financial-twin',
      secondaryCtaText: '8-Factor Risk Survey',
      secondaryCtaLink: '/risk-profiler',
      icon: Sparkles,
      gradient: 'from-slate-950 via-red-950 to-amber-950/60',
      statNumber: '5-Year',
      statLabel: 'Net Worth Simulation',
    },
    {
      id: 2,
      badge: 'Micro-Investment Wealth',
      title: 'Automated Portfolio Allocation &',
      highlightText: 'SIP Growth Engine',
      description: 'Tailored Asset Allocations (Equities, Debt & Liquid Funds) matched to your personalized risk tolerance and monthly budget.',
      ctaText: 'Build Investment Plan',
      ctaLink: '/investment-plan',
      secondaryCtaText: 'Risk Profiler',
      secondaryCtaLink: '/risk-profiler',
      icon: TrendingUp,
      gradient: 'from-red-950 via-amber-950/80 to-slate-950',
      statNumber: '100% Tailored',
      statLabel: 'Risk-Tiered SIP Allocations',
    },
    {
      id: 3,
      badge: 'India Priority Support',
      title: '24/7 Dedicated Advisory &',
      highlightText: 'Toll-Free Customer Care',
      description: 'Have queries about your credit score or portfolio allocations? Connect instantly with our dedicated support desk.',
      ctaText: 'Call +91 1800-123-4567',
      ctaLink: '#',
      onSecondaryClick: onOpenContact,
      secondaryCtaText: 'Open Helpdesk Form',
      secondaryCtaLink: '#',
      icon: PhoneCall,
      gradient: 'from-amber-950/90 via-slate-950 to-red-950',
      statNumber: '+91 1800-123-4567',
      statLabel: 'Toll-Free Help Line (India)',
    },
  ];

  // Autoplay functionality
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const active = slides[currentSlide];
  const Icon = active.icon;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-red-900/50 my-4 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient & Red/Gold Mesh */}
      <div className={`absolute inset-0 bg-gradient-to-r ${active.gradient} transition-all duration-700`} />
      <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Slide Content Animation */}
      <div className="relative z-10 min-h-[300px] sm:min-h-[340px] p-6 sm:p-10 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
          >
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md">
                  <Zap className="w-3 h-3 text-slate-950" />
                  {active.badge}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
                  <Lock className="w-3 h-3 text-amber-400" />
                  256-bit SSL Encrypted
                </span>
              </div>

              <div>
                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                  {active.title}{' '}
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-red-400 bg-clip-text text-transparent block sm:inline">
                    {active.highlightText}
                  </span>
                </h2>
                <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                  {active.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {active.id === 3 ? (
                  <button
                    onClick={onOpenContact}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl shadow-red-600/30 border border-amber-400/40 hover:scale-105"
                  >
                    <span>{active.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>
                ) : (
                  <Link
                    to={active.ctaLink}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl shadow-red-600/30 border border-amber-400/40 hover:scale-105"
                  >
                    <span>{active.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </Link>
                )}

                {active.secondaryCtaText && (
                  active.onSecondaryClick ? (
                    <button
                      onClick={active.onSecondaryClick}
                      className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all"
                    >
                      {active.secondaryCtaText}
                    </button>
                  ) : (
                    <Link
                      to={active.secondaryCtaLink || '#'}
                      className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all"
                    >
                      {active.secondaryCtaText}
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Right Column: Key Feature Card */}
            <div className="lg:col-span-4 hidden lg:flex justify-end">
              <div className="p-6 rounded-2xl bg-slate-900/95 border border-red-900/50 shadow-2xl backdrop-blur-xl space-y-4 max-w-xs text-center w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-yellow-400" />
                <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-amber-400/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Icon className="w-9 h-9" />
                </div>
                <div>
                  <span className="font-mono font-extrabold text-2xl text-amber-400 block">
                    {active.statNumber}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
                    {active.statLabel}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-1 text-[10px] text-amber-400 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  Verified FinTech Algorithm
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Carousel Controls & Indicators */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-red-900/50">
          {/* Indicator Dots */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-9 bg-gradient-to-r from-amber-400 to-yellow-400 shadow-md shadow-amber-400/50'
                    : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-amber-300 border border-slate-800 transition-all"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-amber-300 border border-slate-800 transition-all"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
