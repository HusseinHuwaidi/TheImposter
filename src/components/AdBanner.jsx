import { useEffect, useRef } from 'react';

export default function AdBanner({ slotId, format = 'auto', responsive = 'true', style }) {
  const adRef = useRef(false);
  const pubId = import.meta.env.VITE_ADSENSE_PUB_ID;

  // We consider a slot ID valid if it's provided and doesn't contain "YOUR_" (our placeholder)
  const isSlotValid = slotId && !slotId.includes('YOUR_');

  useEffect(() => {
    // Only push the ad request if the publisher ID is configured, the slot is valid, and we haven't already pushed it
    if (pubId && isSlotValid && !adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adRef.current = true;
      } catch (e) {
        console.error("AdSense injection failed:", e);
      }
    }
  }, [pubId, isSlotValid]);

  // If no Publisher ID is set OR the slot is just a placeholder, render a safe visual placeholder so development isn't broken (and we avoid 400 errors)
  if (!pubId || !isSlotValid) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', borderRadius: '12px', textAlign: 'center', padding: '10px' }}>
        Ad Placeholder<br/>
        <span style={{ fontSize: '0.8rem' }}>Requires real Ad Unit Slot ID</span>
      </div>
    );
  }

  return (
    <ins 
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={pubId}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
}
