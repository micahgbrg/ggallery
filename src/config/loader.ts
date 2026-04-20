import { parse } from 'yaml';
import type { 
  GalleryConfig, 
  RawGalleryConfig, 
  SculptureConfig, 
  TemplateName, 
  WallTheme, 
  FloorTheme, 
  AmbientTheme,
  NavigationMode
} from './schema';
import { 
  defaultTheme, 
  defaultNavigation, 
  defaultAccessibility, 
  defaultSculptureConfig 
} from './defaults';

const ALLOWED_TEMPLATES: TemplateName[] = ["long-hall"];
const ALLOWED_WALL_THEMES: WallTheme[] = ["marble-white", "concrete", "plaster-warm"];
const ALLOWED_FLOOR_THEMES: FloorTheme[] = ["hardwood-dark", "marble-grey", "concrete"];
const ALLOWED_AMBIENT_THEMES: AmbientTheme[] = ["warm", "cool", "neutral", "dramatic"];
const ALLOWED_NAVIGATION_MODES: NavigationMode[] = ["waypoint"];

function isAllowed<T>(value: any, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value);
}

export function loadConfig(rawYaml: string): GalleryConfig {
  let raw: RawGalleryConfig;
  
  try {
    raw = parse(rawYaml) || {};
  } catch (error) {
    throw new Error(`gallery.yaml error: Invalid YAML format. ${(error as Error).message}`);
  }

  if (!raw.gallery || !raw.gallery.title) {
    throw new Error("gallery.yaml error: missing required field 'gallery.title'");
  }

  const template = raw.template || "long-hall";
  if (!isAllowed(template, ALLOWED_TEMPLATES)) {
    throw new Error(`gallery.yaml error: invalid template name '${template}'`);
  }

  const rawTheme = raw.theme || {};
  const walls = rawTheme.walls || defaultTheme.walls;
  if (!isAllowed(walls, ALLOWED_WALL_THEMES)) {
    throw new Error(`gallery.yaml error: invalid wall theme '${walls}'`);
  }
  
  const floor = rawTheme.floor || defaultTheme.floor;
  if (!isAllowed(floor, ALLOWED_FLOOR_THEMES)) {
    throw new Error(`gallery.yaml error: invalid floor theme '${floor}'`);
  }

  const ambient = rawTheme.ambient || defaultTheme.ambient;
  if (!isAllowed(ambient, ALLOWED_AMBIENT_THEMES)) {
    throw new Error(`gallery.yaml error: invalid ambient theme '${ambient}'`);
  }

  const theme = { walls, floor, ambient };

  const rawNav = raw.navigation || {};
  const mode = rawNav.mode || defaultNavigation.mode;
  if (!isAllowed(mode, ALLOWED_NAVIGATION_MODES)) {
    throw new Error(`gallery.yaml error: invalid navigation mode '${mode}'`);
  }
  
  const navigation = {
    mode,
    show_minimap: rawNav.show_minimap !== undefined ? rawNav.show_minimap : defaultNavigation.show_minimap,
    fov: typeof rawNav.fov === 'number' ? rawNav.fov : defaultNavigation.fov
  };

  const rawAccess = raw.accessibility || {};
  const accessibility = {
    keyboard_navigation: rawAccess.keyboard_navigation !== undefined ? rawAccess.keyboard_navigation : defaultAccessibility.keyboard_navigation,
    screen_reader_labels: rawAccess.screen_reader_labels !== undefined ? rawAccess.screen_reader_labels : defaultAccessibility.screen_reader_labels,
    reduced_motion: rawAccess.reduced_motion !== undefined ? rawAccess.reduced_motion : defaultAccessibility.reduced_motion,
  };

  if (!raw.sculptures || !Array.isArray(raw.sculptures) || raw.sculptures.length === 0) {
    throw new Error("gallery.yaml error: must contain at least one sculpture");
  }

  const sculptures: SculptureConfig[] = raw.sculptures.map((rawSculpture, index) => {
    if (!rawSculpture.file) {
      throw new Error(`gallery.yaml error: sculpture at index ${index} is missing required field 'file'`);
    }
    if (!rawSculpture.file.endsWith('.glb') && !rawSculpture.file.endsWith('.gltf')) {
      throw new Error(`gallery.yaml error: sculpture at index ${index} file must end in .glb or .gltf`);
    }

    if (!rawSculpture.title) {
      throw new Error(`gallery.yaml error: sculpture at index ${index} is missing required field 'title'`);
    }

    const scale = rawSculpture.scale !== undefined ? rawSculpture.scale : (defaultSculptureConfig.scale as number);
    if (typeof scale !== 'number' || scale <= 0) {
      throw new Error(`gallery.yaml error: sculpture at index ${index} scale must be a positive number`);
    }

    return {
      file: rawSculpture.file,
      title: rawSculpture.title,
      artist: rawSculpture.artist,
      date: rawSculpture.date,
      medium: rawSculpture.medium,
      description: rawSculpture.description,
      image: rawSculpture.image,
      spotlight: rawSculpture.spotlight !== undefined ? rawSculpture.spotlight : (defaultSculptureConfig.spotlight as boolean),
      scale: scale,
      on_pedestal: rawSculpture.on_pedestal !== undefined ? rawSculpture.on_pedestal : (defaultSculptureConfig.on_pedestal as boolean),
    };
  });

  return {
    gallery: {
      title: raw.gallery.title,
      institution: raw.gallery.institution,
      description: raw.gallery.description,
    },
    template,
    theme,
    navigation,
    accessibility,
    sculptures
  };
}
