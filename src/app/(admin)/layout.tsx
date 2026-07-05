import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Admin pages depend on the session cookie: never prerender them.
export const dynamic = "force-dynamic";

export default function AdminGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
