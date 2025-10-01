
export interface EvidenceFile {
  name: string;
  size: number;
  type: string;
  timestamp: string;
  url: string;
}

export interface IncidentData {
  date: string;
  time: string;
  narrative: string;
  parties: string[];
  children: string[];
  jurisdiction: string;
  evidence: EvidenceFile[];
}

export interface ReportData {
  title: string;
  category: string;
  severity: string;
  severityJustification: string;
  professionalSummary: string;
  observedImpact: string;
  legalInsights: string;
  sources: string[];
  aiNotes: string;
}
