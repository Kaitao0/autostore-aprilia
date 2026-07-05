"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({
  items,
  phone,
  whatsapp,
}: {
  items: Array<{ href: string; label: string }>;
  phone: string | null;
  whatsapp: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Apri il menu di navigazione"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="font-heading text-left text-lg font-bold tracking-tight">
            Autostore<span className="text-primary">.</span>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Principale (mobile)" className="px-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent focus-visible:ring-ring/50 block rounded-md px-3 py-3 text-base font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-4">
          {whatsapp ? (
            <Button variant="outline" asChild>
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle data-icon="inline-start" />
                WhatsApp
              </a>
            </Button>
          ) : null}
          {phone ? (
            <Button asChild>
              <a href={`tel:${phone.replaceAll(" ", "")}`}>
                <Phone data-icon="inline-start" />
                {phone}
              </a>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
