import { useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";

// Cross-fades between pages with the View Transitions API.
// It catches plain clicks on in-app links before React Router does, and runs the navigation inside a transition.
// Browsers without the API, and people who ask for reduced motion, get the normal instant change.
export default function ViewTransitions() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.startViewTransition) return undefined;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onClick = (e) => {
      if (still.matches || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const here = window.location;
      if (url.pathname === here.pathname && url.search === here.search) return; // same page, let the hash work as usual
      e.preventDefault();
      document.startViewTransition(() => {
        flushSync(() => navigate(url.pathname + url.search + url.hash));
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return null;
}
