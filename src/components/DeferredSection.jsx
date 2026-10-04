import { useEffect, useRef, useState } from "react";
export default function DeferredSection({ children, fallback = null, rootMargin = "700px 0px" }) {
  const ref = useRef(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready || !ref.current) return;
    if (!("IntersectionObserver" in window)) { setReady(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setReady(true); observer.disconnect(); } }, { rootMargin });
    observer.observe(ref.current); return () => observer.disconnect();
  }, [ready, rootMargin]);
  return <div ref={ref}>{ready ? children : fallback}</div>;
}
