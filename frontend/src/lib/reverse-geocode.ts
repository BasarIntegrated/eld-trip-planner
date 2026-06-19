import { stateNameToCode } from "@/lib/us-states";

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const ROUTING_USER_AGENT = "SpotterELDTripPlanner/1.0 (assessment project)";

export const NON_US_LOCATION_MESSAGE =
  "Your location is outside the US. Enter a US city in City, ST format.";

interface NominatimReverseResponse {
  address?: Record<string, string>;
  error?: string;
}

export interface ReverseGeocodeResult {
  location: string;
  isUs: boolean;
  warning?: string;
}

function extractCity(address: Record<string, string>): string | null {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.hamlet ||
    null
  );
}

function extractStateSuffix(address: Record<string, string>): string | null {
  const iso = address["ISO3166-2-lvl4"];
  if (iso?.includes("-")) {
    const suffix = iso.split("-", 2)[1];
    if (suffix.length === 2) {
      return suffix.toUpperCase();
    }
  }

  if (address.country_code?.toLowerCase() === "us") {
    return stateNameToCode(address.state);
  }

  return address.country_code?.toUpperCase() ?? null;
}

export function formatUsCityState(address: Record<string, string>): string | null {
  if (address.country_code?.toLowerCase() !== "us") {
    return null;
  }

  const city = extractCity(address);
  const stateCode = extractStateSuffix(address);

  if (!city || !stateCode) {
    return null;
  }

  return `${city}, ${stateCode}`;
}

function formatInternationalCityState(address: Record<string, string>): string | null {
  const city = extractCity(address);
  const stateCode = extractStateSuffix(address);

  if (!city || !stateCode) {
    return null;
  }

  return `${city}, ${stateCode}`;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
    zoom: "10",
  });

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
    headers: { "User-Agent": ROUTING_USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Could not look up your location. Try again or enter City, ST manually.");
  }

  const data = (await response.json()) as NominatimReverseResponse;
  if (!data.address) {
    throw new Error("Could not resolve a city from your coordinates.");
  }

  if (data.address.country_code?.toLowerCase() === "us") {
    const location = formatUsCityState(data.address);
    if (!location) {
      throw new Error("Could not resolve a US city from your coordinates.");
    }
    return { location, isUs: true };
  }

  const location = formatInternationalCityState(data.address);
  if (!location) {
    throw new Error("Could not resolve a city from your coordinates.");
  }

  return {
    location,
    isUs: false,
    warning: NON_US_LOCATION_MESSAGE,
  };
}
