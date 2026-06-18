export interface PersonalAssa {
  id: number;
  tramo: string;
  solicitud?: string | null;
  fechaSolicitud?: string | null;
  estado: 'Activo' | 'Requerimiento';
  capataz?: string | null;
  cargo: string;
  nombres?: string | null;
  codigo?: string | null;
  dni?: string | null;
  fecing?: string | null;
  createdAt?: string;
}

export interface GroupedRequirementReport {
  tramo: string;
  solicitud: string;
  cargo: string;
  cantidad: number;
  fechaSolicitud?: string | null;
}
