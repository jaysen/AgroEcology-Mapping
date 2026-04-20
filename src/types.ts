// 'LH' (Lighthouse) was an earlier category code used in the source spreadsheet.
// It has been renamed to 'SI' (Star Initiative). Raw CSV data may still contain
// 'LH'; create-data-from-csv.js maps it to 'SI' at import time, so 'LH' should
// never appear in a generated data file or at runtime. It is kept in this union
// only so that TypeScript accepts any stale raw data that bypasses the pipeline.
export type PointCategory = 'LS' | 'CC' | 'AEH' | 'SI' | 'LH';

export interface CategoryInfo {
  code: PointCategory;
  label: string;
  description: string;
  color: string;
  textColor: string;
  symbol?: string;
}

export const POINT_CATEGORIES: Record<PointCategory, CategoryInfo> = {
  LS: {
    code: 'LS',
    label: 'Learning site',
    description: 'Offers training and/or other goods and services to wider farmer networks. May be located at a homestead or a separate piece of land.',
    color: '#1a9ea8',
    textColor: '#fff',
    symbol: '✎',
    //symbol: '✎⚑',
  },
  CC: {
    code: 'CC',
    label: 'Community agroecology centre',
    description: 'A well-developed initiative but which does not meet all the criteria of a star initiative. Established by community members. Operates on its own land (not at a homestead).',
    color: '#f26b52',
    textColor: '#fff',
    symbol: '⚑',
    //symbol: '⚑☉⦿⦾◉⊙⊚⦿⦾○⊙⊚☉',
  },
  AEH: {
    code: 'AEH',
    label: 'Agroecology hub',
    description: 'A well-developed initiative but which does not meet all the criteria of a star initiative. Introduced into the community.',
    color: '#1e5837',
    textColor: '#fff',
    symbol: '✻',
    //symbol: '❉✼',
  },
  SI: {
    code: 'SI',
    label: 'Star initiative',
    description: 'High on-farm diversity PLUS at least 4 out of 5 of: mixed farming, on-site seed bank, integrated landscape management, structured training course, and 2+ categories of goods and services offered.',
    color: '#faad5c',
    textColor: '#1a1a1a',
    symbol: '★',
  },
  // LH (Lighthouse) is an alias for SI — kept here as a safety fallback in case
  // a data file is loaded that was not processed through create-data-from-csv.js
  // (which normalises LH → SI). Any LH entry will render identically to SI.
  LH: {
    code: 'SI',
    label: 'Star initiative',
    description: 'High on-farm diversity PLUS at least 4 out of 5 of: mixed farming, on-site seed bank, integrated landscape management, structured training course, and 2+ categories of goods and services offered.',
    color: '#faad5c',
    textColor: '#1a1a1a',
    symbol: '★',
  },
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
