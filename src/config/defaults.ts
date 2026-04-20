import type { GalleryTheme, GalleryNavigation, GalleryAccessibility, SculptureConfig } from './schema';

export const defaultTheme: GalleryTheme = {
  walls: "marble-white",
  floor: "hardwood-dark",
  ambient: "warm"
};

export const defaultNavigation: GalleryNavigation = {
  mode: "waypoint",
  show_minimap: true,
  fov: 60
};

export const defaultAccessibility: GalleryAccessibility = {
  keyboard_navigation: true,
  screen_reader_labels: true,
  reduced_motion: false
};

export const defaultSculptureConfig: Partial<SculptureConfig> = {
  spotlight: false,
  scale: 1.0,
  on_pedestal: true,
};
