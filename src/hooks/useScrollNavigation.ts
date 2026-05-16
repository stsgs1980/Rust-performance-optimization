"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for scroll-based navigation and progress tracking
 * Manages active section detection and scroll progress
 */
export function useScrollNavigation() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  const registerSection = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionsRef.current[id] = el;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 400);

      const scrollY = scrollTop + 120;
      let current = "hero";
      const ids = Object.keys(sectionsRef.current).sort(
        (a, b) =>
          (sectionsRef.current[a]?.offsetTop ?? 0) -
          (sectionsRef.current[b]?.offsetTop ?? 0)
      );
      for (const id of ids) {
        if (sectionsRef.current[id] && sectionsRef.current[id]!.offsetTop <= scrollY)
          current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), []);

  return {
    activeSection,
    scrollProgress,
    showBackToTop,
    registerSection,
    scrollTo,
  };
}
