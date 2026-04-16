import { lazy } from 'react';
import type { SculptureConfig, GalleryTheme } from '../../config/schema';

export interface TemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  minSculptures: number;
  maxSculptures: number;
}

export interface WaypointDef {
  id: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  label: string;
  sculptureIndex?: number;
}

export interface TemplateProps {
  sculptures: SculptureConfig[];
  theme: GalleryTheme;
  onSelect?: (s: SculptureConfig) => void;
}

export const templates: Record<string, { component: React.LazyExoticComponent<React.ComponentType<TemplateProps>>, metadata: TemplateMetadata }> = {
  "long-hall": {
    component: lazy(() => import('./LongHall')),
    metadata: {
      name: "long-hall",
      displayName: "Long Hall",
      description: "A classic gallery corridor where sculptures alternate left and right along the walls.",
      minSculptures: 1,
      maxSculptures: 50
    }
  }
};
