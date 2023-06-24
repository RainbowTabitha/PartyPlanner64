export function recordEvent(eventName: string, params: any) {
  try {
    if ((window as any).gtag) {
      (window as any).gtag("event", eventName, params);
    }
  } catch (e) {
    console.error(e); // But don't crash for analytics.
  }
}
