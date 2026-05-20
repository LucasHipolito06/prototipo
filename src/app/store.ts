export type ClaimStatus = "Em análise" | "Aguardando seguradora" | "Pago" | "Concluído" | "Cancelado";
export type ClaimSeverity = "Baixa" | "Média" | "Alta";
export type RiskLevel = "Baixo" | "Médio" | "Alto";
export type UserRole = "Gerente" | "Regulador" | "Financeiro" | "Analista";

export interface AuditEntry {
  id: string;
  user: string;
  userInitials: string;
  userRole: UserRole;
  timestamp: string; // ISO datetime
  action: string;
  type: "status_change" | "assignment" | "document" | "financial" | "created" | "comment";
}

export interface InsurancePolicy {
  id: string;
  number: string;
  insurer: string;
  type: string;
  coverage: number;
  deductible: number;
  validFrom: string;
  validTo: string;
  status: "Ativa" | "Vencida" | "Em Renovação";
}

export interface Claim {
  id: string;
  store: string;
  type: string;
  otherType?: string;
  severity: ClaimSeverity;
  riskLevel?: RiskLevel;
  status: ClaimStatus;
  date: string;
  description: string;
  files: string[];
  regulator?: string;
  indemnityValue?: number;
  deductibleValue?: number;
  fraudAlert?: boolean;
  tenantNotified?: boolean;
  irregularPolicy?: boolean;
  auditTrail?: AuditEntry[];
  policies?: InsurancePolicy[];
  responsibleArea?: string;
  employeeName?: string;
  employeeContact?: string;
}

export const initialClaims: Claim[] = [
  {
    id: "SIN-001",
    store: "Loja 104 - Vestuário",
    type: "Vazamento / Infiltração",
    severity: "Alta",
    riskLevel: "Alto",
    status: "Em análise",
    date: "2026-04-06",
    description: "Rompimento de cano na laje superior causando alagamento no estoque da loja. Danos estimados em mercadorias e estrutura física do piso.",
    files: ["foto1.jpg", "laudo_bombeiros.pdf", "vistoria_inicial.jpg"],
    fraudAlert: false,
    auditTrail: [
      {
        id: "a1",
        user: "Carlos Silva",
        userInitials: "CS",
        userRole: "Gerente",
        timestamp: "2026-04-06T09:15:00",
        action: "Sinistro registrado no sistema",
        type: "created",
      },
      {
        id: "a2",
        user: "Maria Santos",
        userInitials: "MS",
        userRole: "Analista",
        timestamp: "2026-04-06T10:30:00",
        action: "Evidências fotográficas anexadas (3 arquivos)",
        type: "document",
      },
      {
        id: "a3",
        user: "Carlos Silva",
        userInitials: "CS",
        userRole: "Gerente",
        timestamp: "2026-04-06T14:00:00",
        action: "Status alterado de Em análise para Aguardando seguradora",
        type: "status_change",
      },
    ],
    policies: [
      {
        id: "p1",
        number: "AP-2026-001-RC",
        insurer: "Porto Seguro",
        type: "Responsabilidade Civil",
        coverage: 500000,
        deductible: 5000,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "Ativa",
      },
      {
        id: "p2",
        number: "AP-2026-002-ES",
        insurer: "Bradesco Seguros",
        type: "Danos Estruturais",
        coverage: 1200000,
        deductible: 10000,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "Ativa",
      },
    ],
  },
  {
    id: "SIN-002",
    store: "Loja 210 - Eletrônicos",
    type: "Pico de Energia / Elétrico",
    severity: "Média",
    riskLevel: "Médio",
    status: "Aguardando seguradora",
    date: "2026-04-05",
    description: "Curto circuito no quadro de distribuição, queima de 3 computadores e 1 monitor vitrine.",
    files: [],
    fraudAlert: true,
    auditTrail: [
      {
        id: "b1",
        user: "Roberto Costa",
        userInitials: "RC",
        userRole: "Financeiro",
        timestamp: "2026-04-05T11:00:00",
        action: "Sinistro registrado no sistema",
        type: "created",
      },
      {
        id: "b2",
        user: "Sistema",
        userInitials: "SI",
        userRole: "Analista",
        timestamp: "2026-04-05T11:01:00",
        action: "Alerta de fraude ativado automaticamente — padrão suspeito detectado",
        type: "comment",
      },
    ],
    policies: [
      {
        id: "p3",
        number: "AP-2026-003-EQ",
        insurer: "SulAmérica",
        type: "Equipamentos Eletrônicos",
        coverage: 80000,
        deductible: 2000,
        validFrom: "2026-02-01",
        validTo: "2027-01-31",
        status: "Ativa",
      },
    ],
  },
  {
    id: "SIN-003",
    store: "Praça de Alimentação",
    type: "Incêndio",
    severity: "Alta",
    riskLevel: "Alto",
    status: "Em análise",
    date: "2026-04-01",
    description: "Princípio de incêndio na coifa do restaurante 05. Dano contido pelo sistema de sprinklers, sem vítimas.",
    files: ["vistoria_tecnica.pdf", "relatorio_bombeiros.pdf"],
    regulator: "Carlos Mendes (Susep 1234)",
    fraudAlert: false,
    auditTrail: [
      {
        id: "c1",
        user: "Ana Mendes",
        userInitials: "AM",
        userRole: "Regulador",
        timestamp: "2026-04-01T16:00:00",
        action: "Sinistro registrado no sistema",
        type: "created",
      },
      {
        id: "c2",
        user: "Ana Mendes",
        userInitials: "AM",
        userRole: "Regulador",
        timestamp: "2026-04-02T09:00:00",
        action: "Laudos técnicos anexados (2 documentos)",
        type: "document",
      },
      {
        id: "c3",
        user: "Carlos Silva",
        userInitials: "CS",
        userRole: "Gerente",
        timestamp: "2026-04-02T10:00:00",
        action: "Regulador Carlos Mendes (Susep 1234) designado",
        type: "assignment",
      },
      {
        id: "c4",
        user: "Carlos Mendes",
        userInitials: "CM",
        userRole: "Regulador",
        timestamp: "2026-04-03T14:30:00",
        action: "Status alterado de Aguardando seguradora para Em análise",
        type: "status_change",
      },
    ],
    policies: [
      {
        id: "p4",
        number: "AP-2026-004-IN",
        insurer: "Mapfre",
        type: "Incêndio e Explosão",
        coverage: 2000000,
        deductible: 15000,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "Ativa",
      },
    ],
  },
  {
    id: "SIN-004",
    store: "Quiosque 12 - Joias",
    type: "Dano Físico / Vandalismo",
    severity: "Baixa",
    riskLevel: "Baixo",
    status: "Pago",
    date: "2026-03-25",
    description: "Vidro do expositor trincado durante a madrugada. Câmeras registraram o incidente.",
    files: ["camera_seguranca.mp4", "orcamento_reparo.pdf"],
    regulator: "Ana Souza (Susep 9876)",
    indemnityValue: 4500,
    deductibleValue: 500,
    fraudAlert: false,
    auditTrail: [
      {
        id: "d1",
        user: "Carlos Silva",
        userInitials: "CS",
        userRole: "Gerente",
        timestamp: "2026-03-25T08:00:00",
        action: "Sinistro registrado no sistema",
        type: "created",
      },
      {
        id: "d2",
        user: "Ana Souza",
        userInitials: "AS",
        userRole: "Regulador",
        timestamp: "2026-03-26T10:00:00",
        action: "Regulador Ana Souza (Susep 9876) designado",
        type: "assignment",
      },
      {
        id: "d3",
        user: "Ana Souza",
        userInitials: "AS",
        userRole: "Regulador",
        timestamp: "2026-03-27T15:00:00",
        action: "Aprovação técnica emitida — parecer favorável",
        type: "status_change",
      },
      {
        id: "d4",
        user: "Roberto Costa",
        userInitials: "RC",
        userRole: "Financeiro",
        timestamp: "2026-03-28T09:30:00",
        action: "Valores financeiros definidos: R$ 4.500,00 - Franquia R$ 500,00",
        type: "financial",
      },
      {
        id: "d5",
        user: "Roberto Costa",
        userInitials: "RC",
        userRole: "Financeiro",
        timestamp: "2026-03-28T11:00:00",
        action: "Pagamento aprovado e restituição processada — R$ 4.000,00",
        type: "status_change",
      },
    ],
    policies: [
      {
        id: "p5",
        number: "AP-2026-005-VA",
        insurer: "Zurich Seguros",
        type: "Vandalismo e Danos",
        coverage: 50000,
        deductible: 500,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "Ativa",
      },
    ],
  },
];

// Lojas com apólice irregular/vencida
export const storesWithIrregularPolicy = [
  "Renner - LUC A-118",
  "Outback - LUC C-315",
];

export const hasIrregularPolicy = (storeName: string): boolean => {
  return storesWithIrregularPolicy.includes(storeName);
};

// Simple in-memory store for prototype
let claims = [...initialClaims];

export const getClaims = () => claims;
export const getClaimById = (id: string) => claims.find(c => c.id === id);
export const addClaim = (claim: Claim) => {
  claims.unshift(claim);
};
export const updateClaim = (id: string, updates: Partial<Claim>) => {
  claims = claims.map(c => c.id === id ? { ...c, ...updates } : c);
};
export const addAuditEntry = (claimId: string, entry: AuditEntry) => {
  claims = claims.map(c =>
    c.id === claimId
      ? { ...c, auditTrail: [...(c.auditTrail || []), entry] }
      : c
  );
};
