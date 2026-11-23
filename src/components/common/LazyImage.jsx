import { useEffect, useRef, useState } from "react";

/**
 * Lazy-loaded image inside a fixed-ratio box (reserves space → no layout shift).
 * `ratio` is a CSS aspect-ratio value such as "4/5". Omit it to let the parent size the box.
 */
export default function LazyImage({ src, alt, ratio, className = "", imgClassName = "", eager = false, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setLoaded(Boolean(ref.current?.complete && ref.current?.naturalWidth));
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-evergreen ${loaded ? "" : "img-skeleton"} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        {...rest}
      />
    </div>
  );
}
