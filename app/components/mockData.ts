import { Requirement } from "./types";

export const initialRequirements: Requirement[] = [
  {
    code: "REQ-ASSA-001",
    type: "Staff",
    requestDate: "2026-06-10",
    description: "Asignación de 2 desarrolladores senior Frontend para el módulo de facturación",
    status: "APPROVED",
    requestor: "Carlos Torres",
    priority: "HIGH",
    module: "Facturación",
    attachmentUrl: "#"
  },
  {
    code: "REQ-ASSA-002",
    type: "Machine",
    requestDate: "2026-06-12",
    description: "Aprovisionamiento de servidor de base de datos PostgreSQL en AWS (Staging)",
    status: "APPROVED",
    requestor: "Diana Restrepo",
    priority: "HIGH",
    module: "Infraestructura",
    attachmentUrl: "#"
  },
  {
    code: "REQ-ASSA-003",
    type: "Service",
    requestDate: "2026-06-14",
    description: "Auditoría externa de seguridad y pruebas de penetración (PenTest)",
    status: "PENDING",
    requestor: "Andrés Mendoza",
    priority: "MEDIUM",
    module: "Seguridad",
    attachmentUrl: "#"
  },
  {
    code: "REQ-ASSA-004",
    type: "Staff",
    requestDate: "2026-06-15",
    description: "Diseñador UX/UI para rediseño del módulo de inventarios y almacén",
    status: "PENDING",
    requestor: "Laura Gómez",
    priority: "MEDIUM",
    module: "Inventarios"
  },
  {
    code: "REQ-ASSA-005",
    type: "Machine",
    requestDate: "2026-06-15",
    description: "Renovación de licencias de Docker Desktop Pro para el equipo de desarrollo",
    status: "PENDING",
    requestor: "Eduardo Silva",
    priority: "LOW",
    module: "Herramientas"
  },
  {
    code: "REQ-ASSA-006",
    type: "Service",
    requestDate: "2026-06-16",
    description: "Capacitación de personal en metodologías ágiles y control de calidad (QA)",
    status: "IN_PROGRESS",
    requestor: "Mariana Rivas",
    priority: "LOW",
    module: "Procesos",
    attachmentUrl: "#"
  },
  {
    code: "REQ-ASSA-007",
    type: "Machine",
    requestDate: "2026-06-17",
    description: "Actualización de capacidad de almacenamiento en S3 para respaldos de base de datos",
    status: "REJECTED",
    requestor: "Diana Restrepo",
    priority: "HIGH",
    module: "Infraestructura"
  },
  {
    code: "REQ-ASSA-008",
    type: "Staff",
    requestDate: "2026-06-17",
    description: "Líder de Soporte Técnico para atención de incidencias en producción",
    status: "PENDING",
    requestor: "Carlos Torres",
    priority: "HIGH",
    module: "Soporte",
    attachmentUrl: "#"
  }
];
