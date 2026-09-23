import posthog from 'posthog-js';

// The API key should eventually come from import.meta.env
// For now, we initialize safely so the app doesn't break even if the key is missing.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_dummy_key_replace_me';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let hasCalledInit = false;

export const initAnalytics = (user) => {
  if (hasCalledInit) return;
  hasCalledInit = true;

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Respect user's offline state (caches events in localStorage)
      persistence: 'localStorage+cookie', 
      loaded: (ph) => {
        if (user) {
          identifyUser(user);
        }
      }
    });
  } catch (error) {
    console.error("Analytics initialization failed:", error);
  }
};

export const identifyUser = (user) => {
  if (!user) return;
  
  // Link the user's ID to their session
  posthog.identify(user._id, {
    name: user.name,
    phone: user.phone,
    pincode: user.pincode,
    role: user.role // Admin, Shop, User
  });
};

export const trackEvent = (eventName, properties = {}) => {
  // Automatically inject global context (User Location & Shop Data)
  let customerPincode, shopId, shopName, shopPincode;
  try {
    const user = JSON.parse(localStorage.getItem('packitout_user'));
    customerPincode = user?.pincode;
  } catch(e) {}
  
  try {
    const shop = JSON.parse(localStorage.getItem('packitout_shop'));
    shopId = shop?._id;
    shopName = shop?.name;
    shopPincode = shop?.pincode;
  } catch(e) {}

  // We automatically attach the timestamp and let PostHog handle the rest
  posthog.capture(eventName, {
    customerPincode,
    shopId,
    shopName,
    shopPincode,
    ...properties
  });
};

// Advanced: Try to get precise GPS coordinates for heatmaps, but fail silently
// so we don't annoy the user if they denied permissions.
export const trackEventWithLocation = (eventName, properties = {}) => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        posthog.capture(eventName, {
          ...properties,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        // Fallback: Send without GPS (rely on user pincode via identify)
        posthog.capture(eventName, properties);
      },
      { timeout: 5000, maximumAge: 60000 } // Don't drain battery, use cached location if recent
    );
  } else {
    posthog.capture(eventName, properties);
  }
};
