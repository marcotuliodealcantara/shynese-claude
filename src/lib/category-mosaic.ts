// Layout of the home page category mosaic (2 columns, Pinterest-style).

export type TileSize = 'tall' | 'square' | 'short';

export interface CategoryTile {
  category: string;
  count: number;
  size: TileSize;
}

// Height of each tile relative to its width (3:4, 1:1, 4:3).
export const TILE_HEIGHT_RATIO: Record<TileSize, number> = {
  tall: 4 / 3,
  square: 1,
  short: 3 / 4,
};

// Tile size by ranking, not raw count: categories sorted by number of characters are split
// into thirds — the top third is tall, the middle square, the bottom short. Raw counts are very
// uneven (e.g. 153 vs 7), so proportional sizes would make almost every tile tiny.
export function assignTileSizes(counts: Record<string, number>): CategoryTile[] {
  const ranked = Object.entries(counts).sort(
    ([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB)
  );
  const third = ranked.length / 3;

  return ranked.map(([category, count], rank) => ({
    category,
    count,
    size: rank < third ? 'tall' : rank < third * 2 ? 'square' : 'short',
  }));
}

// Distributes tiles (kept in alphabetical order) into 2 columns, always adding the next tile to
// the shorter column so both columns end up with similar heights.
export function buildMosaicColumns(tiles: CategoryTile[]): [CategoryTile[], CategoryTile[]] {
  const columns: [CategoryTile[], CategoryTile[]] = [[], []];
  const heights = [0, 0];

  [...tiles]
    .sort((a, b) => a.category.localeCompare(b.category))
    .forEach((tile) => {
      const target = heights[0] <= heights[1] ? 0 : 1;
      columns[target].push(tile);
      heights[target] += TILE_HEIGHT_RATIO[tile.size];
    });

  return columns;
}
