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

export interface MaterialReceipt {
  id: number;
  materialRequirementId: number;
  cantidad: number;
  fecha: string;
  createdAt?: string;
}

export interface MaterialRequirement {
  id: number;
  codigoRequerimiento: string;
  codigoRecurso?: string | null;
  recurso?: string | null;
  unidad?: string | null;
  cantidad?: number | null;
  partidaControlCode?: string | null;
  partidaControl?: string | null;
  estado?: string | null;
  cantidadOriginal?: number | null;
  cantidadCotizacion?: string | null;
  cantidadOrdenCompra?: string | null;
  cantidadAlmacen?: string | null;
  cantidadRecibir?: string | null;
  cronogramaEntrega?: string | null;
  codigoAlternoPc?: string | null;
  fechaPedido?: string | null;
  receipts?: MaterialReceipt[];
  createdAt?: string;
}
