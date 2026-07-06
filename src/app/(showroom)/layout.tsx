import type { Metadata } from "next";

export const metadata: Metadata = {
  // Physical in-store surfaces: never indexed.
  robots: { index: false, follow: false },
  title: "Showroom Autostore",
};

export const dynamic = "force-dynamic";

/** Bare layout: no site header/footer, dark fullscreen canvas. */
export default function ShowroomLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh">{children}</div>;
}
