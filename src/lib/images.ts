// Hosts product images may come from (also whitelisted in next.config.ts for next/image).
export const IMAGE_HOSTS = ["images.unsplash.com", "utfs.io"];
export function isAllowedImageUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (IMAGE_HOSTS.includes(u.hostname) || u.hostname.endsWith(".ufs.sh"));
  } catch {
    return false;
  }
}
