export type VehicleClass =
  | 'GENERAL_ACCESS'
  | 'CLASS_1_SPECIAL_PURPOSE'
  | 'CLASS_2_RESTRICTED_ACCESS'
  | 'PBS';

export type AxleConfig = 'SINGLE' | 'TANDEM' | 'TRI' | 'QUAD';

export interface VehicleProfile {
  id: string;
  name: string;
  vehicleClass: VehicleClass;
  lengthMetres: number;
  widthMetres: number;
  heightMetres: number;
  gvmTonnes: number;
  gcmTonnes: number;
  axleConfig: AxleConfig;
  dangerousGoods: boolean;
  permitExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}
