import { getShowroomVehicles } from "@/features/catalog/queries";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import { siteUrl } from "@/lib/env";
import { DisplayRotator } from "./display-rotator";

/**
 * /showroom/display — kiosk slideshow for in-store TVs: auto-rotating
 * vehicles, big price, QR, contacts. Auto-refreshes by polling
 * /api/showroom; keeps the last state when offline.
 */
export default async function ShowroomDisplayPage() {
  const [vehicles, business] = await Promise.all([
    getShowroomVehicles(),
    getBusinessInformation(),
  ]);

  return (
    <DisplayRotator
      initialVehicles={vehicles}
      siteUrl={siteUrl}
      phone={!isPlaceholder(business.phone) ? business.phone : null}
      whatsapp={!isPlaceholder(business.whatsapp) ? business.whatsapp : null}
    />
  );
}
