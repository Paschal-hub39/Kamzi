import { useState, useEffect, useCallback } from 'react';

export function useScreenshotDetect() {
  const [detected, setDetected] = useState(false);
  const [lastDetectTime, setLastDetectTime] = useState(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        triggerDetect('tab_switch');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerDetect('print_screen');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        triggerDetect('save_shortcut');
      }
    };

    // DevTools detection (basic)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        triggerDetect('devtools');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('keydown', handleKeyDown);
    const interval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const triggerDetect = useCallback((source) => {
    setDetected(true);
    setLastDetectTime(new Date());
    console.warn(`Screenshot detected via: ${source}`);
    
    setTimeout(() => {
      setDetected(false);
    }, 5000);
  }, []);

  return {
    detected,
    lastDetectTime,
    triggerDetect
  };
}
