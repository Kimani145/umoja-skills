/**
 * Hierarchical address data for Umoja estate.
 * Structure: Sector → Zone → Courts/Blocks
 */
export interface UmojaZone {
  name: string;
  courts: string[];
}

export interface UmojaSector {
  name: string;
  zones: UmojaZone[];
}

function courts(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Court ${i + 1}`);
}
function sectors(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Sector ${i + 1}`);
}
function blocks(labels: string[]): string[] {
  return labels.map(l => `Block ${l}`);
}
function lanes(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Lane ${i + 1}`);
}

export const UMOJA_LOCATIONS: UmojaSector[] = [
  {
    name: 'Umoja 1',
    zones: [
      { name: 'Zone A', courts: courts(10) },
      { name: 'Zone B', courts: courts(12) },
      { name: 'Zone C', courts: courts(10) },
      { name: 'Zone D', courts: courts(8) },
      { name: 'Zone E', courts: courts(15) },
      { name: 'Zone F', courts: courts(10) },
      { name: 'Zone G', courts: courts(12) },
      { name: 'Zone H', courts: courts(8) },
      { name: 'Zone I', courts: courts(6) },
      { name: 'Zone J', courts: courts(8) },
      { name: 'Zone K', courts: courts(10) },
      { name: 'Zone L', courts: courts(12) },
      { name: 'Zone M', courts: courts(14) },
      { name: 'Zone N', courts: courts(10) },
      { name: 'Zone O', courts: courts(8) },
      { name: 'Zone P', courts: courts(10) },
      { name: 'Zone Q', courts: courts(12) },
    ],
  },
  {
    name: 'Umoja 2',
    zones: [
      { name: 'Zone A', courts: sectors(5) },
      { name: 'Zone B', courts: sectors(4) },
      { name: 'Zone C', courts: sectors(6) },
      { name: 'Zone D', courts: sectors(5) },
      { name: 'Zone E', courts: sectors(4) },
      { name: 'Zone F', courts: sectors(5) },
      { name: 'Zone G', courts: sectors(6) },
      { name: 'Zone H', courts: sectors(4) },
    ],
  },
  {
    name: 'Umoja 3 Extension',
    zones: [
      { name: 'Main', courts: blocks(['A', 'B', 'C', 'D', 'E', 'F', 'G']) },
    ],
  },
  {
    name: 'Umoja Innercore',
    zones: [
      { name: 'Zone A', courts: [...courts(8), ...lanes(8)] },
      { name: 'Zone B', courts: [...courts(6), ...lanes(6)] },
      { name: 'Zone C', courts: [...courts(10), ...lanes(10)] },
      { name: 'Zone D', courts: [...courts(8), ...lanes(8)] },
      { name: 'Zone E', courts: [...courts(6), ...lanes(6)] },
    ],
  },
];

/** Build a flat address string from parts */
export function buildAddress(
  sector: string,
  zone: string,
  court: string,
  house: string
): string {
  const parts = [sector, zone, court, house].filter(Boolean);
  return parts.join(', ');
}
