"use client";

import {
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
} from "react";

type ReferenceImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "loading"
> & {
  src: string;
  eager?: boolean;
  rootSelector?: string;
  variant?: "thumbnail" | "display";
};

const localExpansion = /^\/images\/expansion\/([^/]+)\.(?:png|jpe?g|webp)$/i;

export function optimizedReferenceImage(
  src: string,
  variant: "thumbnail" | "display",
) {
  const match = src.match(localExpansion);
  if (!match) return src;
  const folder = variant === "thumbnail" ? "thumbs" : "display";
  return `/images/expansion/${folder}/${match[1]}.webp`;
}

/**
 * Assigns a network source only when a library image is close to its own
 * scroll viewport. Native lazy loading remains as a fallback, while local
 * research images use pre-sized derivatives instead of multi-megabyte files.
 */
export default function ReferenceImage({
  src,
  eager = false,
  rootSelector,
  variant = "thumbnail",
  fetchPriority,
  alt = "",
  ...props
}: ReferenceImageProps) {
  const image = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(eager);
  const optimized = optimizedReferenceImage(src, variant);

  useEffect(() => {
    if (eager) return;
    const element = image.current;
    if (!element || !("IntersectionObserver" in window)) {
      const timer = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timer);
    }
    const root = rootSelector
      ? (element.closest(rootSelector) as Element | null)
      : null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setReady(true);
        observer.disconnect();
      },
      { root, rootMargin: "180px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [eager, rootSelector]);

  return (
    <img
      {...props}
      ref={image}
      src={eager || ready ? optimized : undefined}
      data-reference-src={optimized}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={fetchPriority ?? (eager ? "high" : "low")}
    />
  );
}
