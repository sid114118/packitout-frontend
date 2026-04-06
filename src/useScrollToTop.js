import { useEffect } from 'react';

export default function useScrollToTop() {
  useEffect(() => {
    // Instantly snap to the top when the component loads
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' 
    });
  }, []);
}
