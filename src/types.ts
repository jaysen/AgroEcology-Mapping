export type PointCategory = 'LS' | 'CC' | 'AEH' | 'LH';

export interface CategoryInfo {
  code: PointCategory;
  label: string;
  color: string;
  textColor: string;
}

export const POINT_CATEGORIES: Record<PointCategory, CategoryInfo> = {
  LS:  { code: 'LS',  label: 'Learning site',                 color: '#3b82f6', textColor: '#fff' },
  CC:  { code: 'CC',  label: 'Community agroecology centre',   color: '#f97316', textColor: '#fff' },
  AEH: { code: 'AEH', label: 'Agroecology hub',               color: '#8b5cf6', textColor: '#fff' },
  LH:  { code: 'LH',  label: 'Lighthouse',                    color: '#eab308', textColor: '#1a1a1a' },
};

export interface AgroEcologyProject {
  id: number;
  name: string;
  category: PointCategory;
  location: {
    lat: number;
    lng: number;
    place: string;
    region: string;
    country: string;
  };
  description: string;
  type: string;
  practices: string[];
  established: number;
  size_hectares: number;
  beneficiaries: number;
  crops: string[];
  organization: string;
  contact?: string;
  website?: string;
  status: 'active' | 'pilot' | 'completed';
}
