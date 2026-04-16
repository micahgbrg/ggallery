export type TemplateName = "long-hall";

export type WallTheme = "marble-white" | "concrete" | "plaster-warm";
export type FloorTheme = "hardwood-dark" | "marble-grey" | "concrete";
export type AmbientTheme = "warm" | "cool" | "neutral" | "dramatic";

export type NavigationMode = "waypoint";

export interface GalleryTheme {
  walls: WallTheme;
  floor: FloorTheme;
  ambient: AmbientTheme;
}

export interface GalleryNavigation {
  mode: NavigationMode;
  show_minimap: boolean;
}

export interface GalleryAccessibility {
  keyboard_navigation: boolean;
  screen_reader_labels: boolean;
  reduced_motion: boolean;
}

export interface SculptureConfig {
  file: string;
  title: string;
  artist?: string;
  date?: string;
  medium?: string;
  description?: string;
  image?: string;
  spotlight: boolean;
  scale: number;
}

export interface GalleryMetadata {
  title: string;
  institution?: string;
  description?: string;
}

export interface GalleryConfig {
  gallery: GalleryMetadata;
  template: TemplateName;
  theme: GalleryTheme;
  sculptures: SculptureConfig[];
  navigation: GalleryNavigation;
  accessibility: GalleryAccessibility;
}

// Partial typed interfaces for raw parsed YAML before defaults/validation are applied
export interface RawSculptureConfig {
  file?: string;
  title?: string;
  artist?: string;
  date?: string;
  medium?: string;
  description?: string;
  image?: string;
  spotlight?: boolean;
  scale?: number;
}

export interface RawGalleryMetadata {
  title?: string;
  institution?: string;
  description?: string;
}

export interface RawGalleryConfig {
  gallery?: RawGalleryMetadata;
  template?: string;
  theme?: Partial<GalleryTheme>;
  sculptures?: RawSculptureConfig[];
  navigation?: Partial<GalleryNavigation>;
  accessibility?: Partial<GalleryAccessibility>;
}
