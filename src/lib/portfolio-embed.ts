export const GUEST_USERNAME = "guest";

export function isPortfolioEmbed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("embed") === "1";
  } catch {
    return false;
  }
}

export function isGuestUsername(username: string | null | undefined): boolean {
  return String(username ?? "").trim().toLowerCase() === GUEST_USERNAME;
}

export function isGuestMode(username: string | null | undefined): boolean {
  return isPortfolioEmbed() && isGuestUsername(username);
}

export function guestProgressId(paperId: number): number {
  return 900_000_000 + paperId;
}

export function isGuestProgressId(progressId: number): boolean {
  return progressId >= 900_000_000;
}

export function paperIdFromGuestProgressId(progressId: number): number {
  return progressId - 900_000_000;
}
