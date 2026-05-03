import { useEffect, useRef } from 'react';

export default function AdBanner({ slotId, format = 'auto', responsive = 'true', style }) {
  const adRef = useRef(false);

  useEffect(() => {
    // Only push the ad request if the publisher ID is configured and we haven't already pushed it for this mount
    const pubId = import.meta.env.VITE_ADSENSE_PUB_ID;
    if (pubId && !adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adRef.current = true;
      } catch (e) {
        console.error("AdSense injection failed:", e);
      }
    }
  }, []);

  // If no Publisher ID is set, render the placeholder so development isn't broken
  if (!import.meta.env.VITE_ADSENSE_PUB_ID) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
        Ad Placeholder (Set VITE_ADSENSE_PUB_ID)
      </div>
    );
  }

  return (
    <ins 
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={import.meta.env.VITE_ADSENSE_PUB_ID}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
}
