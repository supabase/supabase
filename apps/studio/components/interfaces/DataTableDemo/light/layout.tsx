"use client";

import { Kbd } from "@/components/custom/kbd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHotKey } from "@/hooks/use-hot-key";
import { ArrowRight, ChevronRight, Database, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Button
        className="fixed left-1.5 top-1.5 z-[100] -translate-y-12 opacity-0 transition-all focus-visible:translate-y-0 focus-visible:opacity-100"
        asChild
      >
        <Link id="skip-to-content" href="#content">
          Skip to content
        </Link>
      </Button>
      {children}
      <div className="fixed bottom-4 left-4 z-50">
        <APIPopover />
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <ButtonPile />
      </div>
    </>
  );
}

function ButtonPile() {
  return (
    <div className="group/pile relative pt-1.5">
      <Button asChild className="group">
        <a
          href="https://github.com/openstatusHQ/data-table-filters"
          target="_blank"
          rel="noreferrer"
        >
          <span className="mr-1">View GitHub Repo</span>
          <ArrowRight className="relative mb-[1px] inline h-4 w-0 transition-all group-hover:w-4" />
          <ChevronRight className="relative mb-[1px] inline h-4 w-4 transition-all group-hover:w-0" />
        </a>
      </Button>
      <Button
        asChild
        className="group absolute -right-1.5 top-0 -z-10 opacity-70 transition-transform group-hover/pile:-translate-x-1.5 group-hover/pile:-translate-y-10 group-hover/pile:opacity-100"
      >
        <a href="https://light.openstatus.dev" target="_blank" rel="noreferrer">
          <span className="mr-1">Explore Light OS</span>
          <ArrowRight className="relative mb-[1px] inline h-4 w-0 transition-all group-hover:w-4" />
          <ChevronRight className="relative mb-[1px] inline h-4 w-4 transition-all group-hover:w-0" />
        </a>
      </Button>
    </div>
  );
}

function APIPopover() {
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState("");
  useHotKey(() => setOpen((prev) => !prev), "j");

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tb_endpoint="));
    if (cookie) {
      setEndpoint(decodeURIComponent(cookie.split("=")[1]));
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    document.cookie = `tb_endpoint=${encodeURIComponent(endpoint)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="h-8 w-8">
          <Database className="h-4 w-4" />
          <span className="sr-only">OpenStatus Light Viewer</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" sideOffset={10} className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium leading-none">
                OpenStatus Light Viewer
              </h4>
              <Kbd variant="outline">
                <span className="mr-1">⌘</span>
                <span>J</span>
              </Kbd>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure the API endpoint for your{" "}
              <a
                href="https://github.com/openstatusHQ/vercel-edge-ping"
                target="_blank"
                rel="noreferrer"
              >
                <code className="rounded-sm bg-muted px-0.5 underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
                  vercel-edge-ping
                </code>
              </a>{" "}
              project.
            </p>
          </div>
          {/* TODO: use form */}
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <div className="flex-1">
              <Label htmlFor="endpoint" className="sr-only">
                Endpoint
              </Label>
              <Input
                type="url"
                id="endpoint"
                name="endpoint"
                placeholder="https://light.openstatus.dev"
                pattern="https://.*"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="h-8"
              />
            </div>
            <Button type="submit" size="icon" className="h-8 w-8">
              <Zap className="h-4 w-4" />
              <span className="sr-only">Save</span>
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
