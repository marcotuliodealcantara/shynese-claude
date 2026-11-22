// Category background images live in src/assets/categories/<slug>.jpg.
// Every file in that folder is picked up automatically (Vite fingerprints them at build time),
// so adding or replacing an image only means dropping the file there with the right name.
const images = import.meta.glob<string>('../assets/categories/*.jpg', {
  eager: true,
  import: 'default',
});

const imagesBySlug: Record<string, string> = Object.fromEntries(
  Object.entries(images).map(([path, url]) => [path.split('/').pop()!.replace(/\.jpg$/, ''), url])
);

// "Numbers & Dates" → "numbers-dates", "At the City" → "at-the-city"
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryImage(category: string): string | undefined {
  return imagesBySlug[categorySlug(category)];
}
