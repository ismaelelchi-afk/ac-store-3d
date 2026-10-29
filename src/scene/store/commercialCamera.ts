import { VIEWPOINTS, type ViewpointId } from './constants';

export type CommercialViewId = ViewpointId;

export interface CommercialViewPose {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

export interface CommercialView extends CommercialViewPose {
  id: CommercialViewId;
  label: string;
}

/**
 * Vistas comerciales de A/C Store 3D: los puntos de vista reales que ya utiliza la
 * navegación de la tienda. El editor y la persistencia se apoyan en estos ids.
 */
export const COMMERCIAL_VIEWS: readonly CommercialView[] = VIEWPOINTS.map((viewpoint) => ({
  id: viewpoint.id,
  label: viewpoint.label,
  position: [viewpoint.position[0], viewpoint.position[1], viewpoint.position[2]],
  target: [viewpoint.target[0], viewpoint.target[1], viewpoint.target[2]],
}));
