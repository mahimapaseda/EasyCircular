/** Sri Lanka's 25 administrative districts (English names). */
export const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
] as const;

export type SriLankaDistrict = (typeof SRI_LANKA_DISTRICTS)[number];

export function filterDistricts(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SRI_LANKA_DISTRICTS].slice(0, limit);
  return SRI_LANKA_DISTRICTS.filter((d) => d.toLowerCase().includes(q)).slice(0, limit);
}
