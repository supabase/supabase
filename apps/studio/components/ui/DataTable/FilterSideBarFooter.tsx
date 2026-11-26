import { useParams } from "common";
import { BracesIcon, Volume1Icon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Button, cn } from "ui";

interface FooterCarouselItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  linkText: string;
}

export function FilterSideBarFooter() {
  const { ref } = useParams();
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const items: FooterCarouselItem[] = [
    {
      id: "log-volume",
      title: "Reduce log volume",
      description: "Log only errors to cut noise and storage costs.",
      icon: <Volume1Icon size={14} strokeWidth={1.5} />,
      href: `/project/${ref}/settings/general#logs`,
      linkText: "Go to project settings",
    },
    {
      id: "log-drains",
      title: "Capture your logs",
      description:
        "Send logs to your preferred observability or storage platform.",
      icon: <BracesIcon size={14} strokeWidth={1.5} />,
      href: `/project/${ref}/settings/log-drains`,
      linkText: "Go to Log Drains",
    },
  ];

  const activeItem = items[activeIndex];
  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.2 };

  return (
    <section
      aria-label="Suggestions"
      className="relative flex shrink-0 flex-col gap-3 border-t border-default p-3"
    >
      <div className="absolute right-3 top-4 flex items-center gap-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            tabIndex={0}
            aria-label={`Show "${item.title}"`}
            aria-current={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] cursor-pointer",
              i === activeIndex
                ? "w-1.5 bg-foreground"
                : "w-1.5 bg-foreground-muted/40",
            )}
          />
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={transition}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-foreground">{activeItem.title}</h3>
            <p className="text-xs text-foreground-lighter">
              {activeItem.description}
            </p>
          </div>
          <Button asChild block variant="outline" icon={activeItem.icon}>
            <Link href={activeItem.href}>{activeItem.linkText}</Link>
          </Button>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
