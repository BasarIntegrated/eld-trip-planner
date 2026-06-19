import { NextResponse } from "next/server";

import { reverseGeocode } from "@/lib/reverse-geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ detail: "Invalid coordinates." }, { status: 400 });
  }

  try {
    const result = await reverseGeocode(lat, lng);
    return NextResponse.json(result);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Reverse geocoding failed.";
    return NextResponse.json({ detail }, { status: 422 });
  }
}
