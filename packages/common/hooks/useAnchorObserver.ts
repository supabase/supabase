import { useEffect, useState } from 'react';

/**
 * Find the active heading of page
 *
 * It selects the top heading by default, and the last item when reached the bottom of page.
 *
 * @param watch - An array of element ids to watch
 * @param single - only one active item at most
 * @returns Active anchor
 */
export function useAnchorObserver(watch: string[], single: boolean): string[] {
  const [activeAnchor, setActiveAnchor] = useState<string[]>([]);

  useEffect(() => {
    let visible: string[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !visible.includes(entry.target.id)) {
            visible = [...visible, entry.target.id];
          } else if (
            !entry.isIntersecting &&
            visible.includes(entry.target.id)
          ) {
            visible = visible.filter((v) => v !== entry.target.id);
          }
        }

        if (visible.length > 0) setActiveAnchor(visible);
      },
      {
        rootMargin: single ? '-80px 0% -70% 0%' : `-20px 0% -40% 0%`,
        threshold: 1,
      },
    );

    function onScroll(): void {
      const element = document.scrollingElement;
      if (!element) return;

      if (element.scrollTop === 0 && single) setActiveAnchor(watch.slice(0, 1));
      else if (
        element.scrollTop + element.clientHeight >=
        element.scrollHeight - 6
      ) {
        setActiveAnchor((active) => {
          return active.length > 0 && !single
            ? watch.slice(watch.indexOf(active[0]))
            : watch.slice(-1);
        });
      }
    }

    for (const heading of watch) {
      const element = document.getElementById(heading);

      if (element) observer.observe(element);
    }

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [single, watch]);

  return single ? activeAnchor.slice(0, 1) : activeAnchor;
}
