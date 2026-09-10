/**
 * KTLN's photography still lives on Wix's CDN. Those URLs carry a resize
 * transform in the path (`/v1/fill/w_147,h_147,...`), and the scrape captured
 * them at whatever thumbnail size the old site happened to render — far too
 * small for full-bleed cards.
 *
 * `wix()` rewrites that segment, so we ask the CDN for the size we actually
 * need instead of upscaling a thumbnail in the browser. Verified: the same
 * asset returns a real 1600x1800 JPEG rather than a stretched 344x361.
 *
 * Swap these ids for locally-hosted assets once the client hands over
 * originals — every consumer goes through `wix()`, so it is a one-file change.
 */
const CDN = "https://static.wixstatic.com/media";

export function wix(id: string, w: number, h: number, quality = 90): string {
  return `${CDN}/${id}/v1/fill/w_${w},h_${h},al_c,q_${quality}/file.jpg`;
}

/**
 * Section backgrounds for the masked-card mosaic. Each of these is one large
 * photo that several cards window into, so it needs real resolution and a
 * subject that survives being cropped in unpredictable places.
 */
export const BACKDROPS = {
  // Dark, low-key frame: the white display type needs a backdrop that stays
  // out of its way, and the polaroid-collage shot was too busy behind it.
  hero: wix("e9e8e3_dacd97f5c01e4381a43bd2fdbbc128db~mv2.jpg", 2400, 1500),
  services: wix("e9e8e3_dacd97f5c01e4381a43bd2fdbbc128db~mv2.jpg", 2000, 1600),
  story: wix("e9e8e3_dad9b824726b4504837e7540d8cd4f2c~mv2.webp", 1800, 1500),
} as const;

/** Portrait-oriented treatment photography. */
export const PORTRAITS = {
  brows: wix("e9e8e3_dd237ec68abc44d8a364b01612ce39be~mv2.webp", 1000, 1340),
  lashes: wix("e9e8e3_52fa59f6b2744d27a24e9c0a9ccc5248~mv2.webp", 1000, 1340),
  studio: wix("e9e8e3_641cc4158377434d99969aa6aa652c41~mv2.webp", 1000, 1380),
  smile: wix("e9e8e3_ed2ffa03430d42d9978aaa168e48e2c8f000.jpg", 1000, 1300),
} as const;

/** Before/after work, used in the results marquee. */
export const GALLERY = [
  { src: wix("e9e8e3_cda7ad4862df48c1b3775810613a1003~mv2.webp", 900, 900), alt: "Microblading transformation" },
  { src: wix("e9e8e3_6d93566cad7d4bacb7d751d954c84498~mv2.webp", 900, 900), alt: "Natural brow enhancement" },
  { src: wix("e9e8e3_64fe3c72857845c5b72bf65c432e1547~mv2.jpg", 900, 900), alt: "Classic lash set" },
  { src: wix("e9e8e3_b40954a6507147a296232df501793d27~mv2.jpg", 900, 900), alt: "Lash set before and after" },
  { src: wix("e9e8e3_be3c169b54574106a4edab62891963d9~mv2.jpeg", 900, 900), alt: "Teeth whitening before and after" },
  { src: wix("e9e8e3_f8bf33c813c94ade9d91b9625ed47503~mv2.jpg", 900, 900), alt: "Happy teeth whitening client" },
  { src: wix("e9e8e3_8ea90d0d681f409eb6397f9663b96fc2~mv2.jpg", 900, 900), alt: "Classic set" },
  { src: wix("e9e8e3_886f72a9f0c74b938065dbf57fc47c46~mv2.jpeg", 900, 900), alt: "Teeth whitening in Clovis, CA" },
] as const;
