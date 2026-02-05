export interface AgroEcologyProject {
  id: number;
  name: string;
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
