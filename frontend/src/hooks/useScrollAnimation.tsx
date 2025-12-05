import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Usage component
export function AnimatedSection({ 
  children, 
  className = "",
  animation = "animate-fade-in"
}: {
  children: React.ReactNode;
  className?: string;
  animation?: string;
}) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div 
      ref={ref} 
      className={`${className} ${isVisible ? animation : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}