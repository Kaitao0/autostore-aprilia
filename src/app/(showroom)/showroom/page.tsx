import { getShowroomVehicles } from "@/features/catalog/queries";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import { siteUrl } from "@/lib/env";
import { ShowroomBrowser } from "./showroom-browser";

/**
 * /showroom — interactive tablet mode: big touch targets, simplified
 * detail with QR to the public page, no site chrome.
 */
export default async function ShowroomPage() {
  const [vehicles, business] = await Promise.all([
    getShowroomVehicles(),
    getBusinessInformation(),
  ]);

  return (
    <ShowroomBrowser
      vehicles={vehicles}
      siteUrl={siteUrl}
      phone={!isPlaceholder(business.phone) ? business.phone : null}
    />
  );
}
