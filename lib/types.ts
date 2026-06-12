export interface WeeklyDataPoint {
  weekStart: string;  // ISO 8601 date
  weekLabel: string;  // "Jan 6", "Jan 13", …
  callAcceptanceRate: number;  // percentage 0–100
  scheduleAdherence: number;
  qaScore: number;
  callVolume: number;
}

export interface MonthlyDataPoint {
  month: string;  // "Jan", "Feb", …
  callAcceptanceRate: number;
  scheduleAdherence: number;
  qaScore: number;
  callVolume: number;
}

export interface KpiSummary {
  current: number;  // 6-month average
  delta: number;    // vs prior 6-month period, in percentage points
}

export interface DashboardData {
  weekly: WeeklyDataPoint[];
  monthly: MonthlyDataPoint[];
  summary: {
    callAcceptanceRate: KpiSummary;
    scheduleAdherence: KpiSummary;
    qaScore: KpiSummary;
  };
  lastUpdated: string;
}

export interface Agent {
  id: string;   // url-safe slug, e.g. "sarah-chen"
  name: string;
}

export interface AgentSummary extends Agent {
  summary: DashboardData['summary'];
  avgCallVolume: number; // weekly average
}

// Full per-agent data — same shape as DashboardData plus identity.
export interface AgentData extends DashboardData {
  agent: Agent;
}
