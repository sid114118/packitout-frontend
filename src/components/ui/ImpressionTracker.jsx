import React, { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../../utils/analyticsEngine.js';

/**
 * Wraps any component and fires a 'PRODUCT_VIEWED' event if the component
 * remains visible on screen for more than 1 second.
 * This is crucial for calculating CTR (Click Through Rate) without draining battery.
 */
export default function ImpressionTracker({ product, category, listPosition, children }) {
  const containerRef = useRef(null);
  const [hasFired, setHasFired] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // If we've already tracked this product in this session, don't double-track
    if (hasFired || !product) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          // Element just came into view. Start a 1 second timer.
          // We don't want to track items the user just scrolled past really fast.
          timerRef.current = setTimeout(() => {
            // trackEvent('PRODUCT_VIEWED', { ... }); // Disabled to save PostHog data quota
            setHasFired(true); // Ensure it only fires once
          }, 1000); 
        } else {
          // Element went out of view before 1 second. Cancel the timer.
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.75 // 75% of the card must be visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [hasFired, product, category, listPosition]);

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
