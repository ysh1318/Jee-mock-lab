import { useState, useEffect } from "react";

export function useOrientation(breakpoint = 800) {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerWidth < breakpoint && window.innerHeight > window.innerWidth) {
        setIsPortraitMobile(true);
      } else {
        setIsPortraitMobile(false);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
    };
  }, [breakpoint]);

  return { isPortraitMobile };
}
