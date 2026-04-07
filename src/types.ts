export type PointCategory = 'LS' | 'CC' | 'AEH' | 'LH';

export interface CategoryInfo {
  code: PointCategory;
  label: string;
  color: string;
  textColor: string;
}

export const POINT_CATEGORIES: Record<PointCategory, CategoryInfo> = {
  LS:  { code: 'LS',  label: 'Learning site',                 color: '#30858a', textColor: '#fff' },
  CC:  { code: 'CC',  label: 'Community agroecology centre',   color: '#f26b52', textColor: '#fff' },
  AEH: { code: 'AEH', label: 'Agroecology hub',               color: '#3b6b4a', textColor: '#fff' },
  LH:  { code: 'LH',  label: 'Lighthouse',                    color: '#faad5c', textColor: '#1a1a1a' },
};

export interface AgroEcologyProject {
  id: number;
  name: string;
  category: PointCategory;
  contact: string;
  phone?: string;
  email?: string;
  province: string;
  district: string;
  nearestTown: string;
  location: {
    lat: number;
    lng: number;
  };
  yearStarted: number;
  // Attributes (Y = true, blank = false)
  highOnFarmDiversity: boolean;
  mixedFarming: boolean;
  seedBankIndividual: boolean;
  seedBankCollective: boolean;
  organisedSeedExchange: boolean;
  integratedLandscapeManagement: boolean;
  onSiteTraining: boolean;
  structuredTrainingProgrammes: boolean;
  trainingType: string;       // S, I, L or combinations
  trainingAccreditation: boolean;
  gsInputSupply: boolean;
  gsMentorshipTechSupport: boolean;
  gsMarketingServices: boolean;
}
