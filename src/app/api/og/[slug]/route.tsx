import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { ImageResponse } from "next/og";
import { getVehicleBySlug, vehicleTitle } from "@/features/catalog/queries";
import { formatMileage, formatPrice } from "@/lib/format";
import { fuelTypeLabels } from "@/lib/labels";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

async function resolveCoverSrc(
  coverUrl: string | null,
): Promise<string | null> {
  if (!coverUrl) return null;
  if (coverUrl.startsWith("http")) return coverUrl;
  // Local /public asset (demo covers): inline as data URL.
  try {
    const publicDir = join(process.cwd(), "public");
    const filePath = join(publicDir, coverUrl);
    // Never read outside /public, whatever the stored URL contains.
    if (!filePath.startsWith(publicDir + sep)) return null;
    const file = await readFile(filePath);
    const ext = coverUrl.split(".").pop() ?? "webp";
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);

  if (!vehicle) {
    return new Response("Not found", { status: 404 });
  }

  const title = vehicleTitle(vehicle);
  const cover = await resolveCoverSrc(vehicle.cover_image_url);
  const details = [
    vehicle.year,
    vehicle.mileage !== null ? formatMileage(vehicle.mileage) : null,
    vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#080808",
          color: "#f7f7f5",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 48px 56px 64px",
            width: cover ? "55%" : "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 34, fontWeight: 700 }}>Autostore</span>
            <span style={{ fontSize: 34, fontWeight: 700, color: "#f97316" }}>
              .
            </span>
            <span style={{ fontSize: 22, color: "#b8b8b8", marginLeft: 16 }}>
              Aprilia (LT)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                width: 64,
                height: 6,
                backgroundColor: "#f97316",
                marginBottom: 28,
              }}
            />
            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: -1.5,
                display: "flex",
              }}
            >
              {title.length > 46 ? `${title.slice(0, 45)}…` : title}
            </div>
            {details ? (
              <div
                style={{
                  fontSize: 26,
                  color: "#b8b8b8",
                  marginTop: 20,
                  display: "flex",
                }}
              >
                {details}
              </div>
            ) : null}
          </div>

          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#f97316",
              display: "flex",
            }}
          >
            {formatPrice(vehicle.price, vehicle.price_on_request)}
          </div>
        </div>

        {/* Right: cover image */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={WIDTH * 0.45}
            height={HEIGHT}
            style={{
              width: "45%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
