"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  ExternalLink,
  Gauge,
  Inbox,
  LogOut,
  Plug,
  Repeat,
  Settings,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", href: "/admin", icon: Gauge, exact: true },
  { title: "Veicoli", href: "/admin/veicoli", icon: Car, exact: false },
  { title: "Lead", href: "/admin/lead", icon: Inbox, exact: false },
  { title: "Permute", href: "/admin/permute", icon: Repeat, exact: false },
];

const superAdminNav = [
  {
    title: "Impostazioni",
    href: "/admin/impostazioni",
    icon: Settings,
    exact: false,
  },
  {
    title: "Integrazioni",
    href: "/admin/integrazioni",
    icon: Plug,
    exact: false,
  },
];

export function AdminSidebar({
  userEmail,
  isSuperAdmin,
}: {
  userEmail: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <Link href="/admin" className="font-heading text-lg font-bold tracking-tight">
          Autostore
          <span className="text-primary">.</span>
          <span className="text-muted-foreground ml-2 text-xs font-normal tracking-normal">
            admin
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Amministrazione</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href, item.exact)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t p-3">
        <Button variant="ghost" size="sm" className="justify-start" asChild>
          <Link href="/" target="_blank" rel="noopener">
            <ExternalLink data-icon="inline-start" />
            Vai al sito
          </Link>
        </Button>
        <p className="text-muted-foreground truncate px-2 text-xs" title={userEmail}>
          {userEmail}
        </p>
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut data-icon="inline-start" />
            Esci
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
