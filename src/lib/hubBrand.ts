import { HUB } from "@/lib/hubConfig";

export type HubBrandColors = {
  primary: string;
  primaryDark: string;
  accent: string;
};

/** Parrot Canada uses green; Xander Learning Hub uses navy blue. */
export function hubBrand(): HubBrandColors {
  const label = `${HUB.name} ${HUB.company}`.toLowerCase();
  const isParrotCanada =
    label.includes("parrot canada") ||
    label.includes("parrot global study academy") ||
    label.includes("parrotglobalstudyacademy");

  if (isParrotCanada) {
    return {
      primary: "#012F6B",
      primaryDark: "#0a3d7a",
      accent: "#E01C21",
    };
  }

  return {
    primary: "#254D81",
    primaryDark: "#1D3B66",
    accent: "#E01C21",
  };
}
