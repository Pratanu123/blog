let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";
let savedPosition = "";
let savedTop = "";
let savedLeft = "";
let savedRight = "";
let savedWidth = "";
let savedScrollY = 0;

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

/** Ref-counted body scroll lock. Safe when several overlays stack. */
export function lockBodyScroll() {
  if (typeof document === "undefined") return () => undefined;

  if (lockCount === 0) {
    const { body } = document;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    savedPosition = body.style.position;
    savedTop = body.style.top;
    savedLeft = body.style.left;
    savedRight = body.style.right;
    savedWidth = body.style.width;
    savedScrollY = window.scrollY;

    body.style.overflow = "hidden";
    if (scrollbar > 0) {
      body.style.paddingRight = `${scrollbar}px`;
    }

    // iOS / mobile: overflow:hidden alone often leaves the page stuck.
    if (isMobileViewport()) {
      body.style.position = "fixed";
      body.style.top = `-${savedScrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }
  }

  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    unlockBodyScroll();
  };
}

function unlockBodyScroll() {
  if (typeof document === "undefined" || lockCount <= 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  const { body } = document;
  body.style.overflow = savedOverflow;
  body.style.paddingRight = savedPaddingRight;
  body.style.position = savedPosition;
  body.style.top = savedTop;
  body.style.left = savedLeft;
  body.style.right = savedRight;
  body.style.width = savedWidth;

  if (savedPosition === "fixed" || isMobileViewport()) {
    window.scrollTo(0, savedScrollY);
  }
}

/** Hard reset after route changes so a leaked lock cannot freeze mobile scrolling. */
export function resetBodyScrollLock() {
  if (typeof document === "undefined") return;

  lockCount = 0;
  const { body } = document;
  const stuckFixed = body.style.position === "fixed";
  const top = body.style.top;
  const y = stuckFixed && top.startsWith("-") ? Math.abs(parseInt(top, 10) || 0) : window.scrollY;

  body.style.overflow = "";
  body.style.paddingRight = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";

  if (stuckFixed) {
    window.scrollTo(0, y);
  }
}
