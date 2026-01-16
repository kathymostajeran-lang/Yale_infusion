
export enum ProtocolSection {
  INITIAL = 'Initial Calculation',
  HYPOGLYCEMIA = 'Hypoglycemia Management',
  ADJUSTMENT = 'Infusion Rate Adjustment',
  RAPID_FALL_WARNING = 'Rapid Fall (Section †)'
}

export interface CalculationResult {
  section: ProtocolSection;
  action: string;
  newRate: number | string;
  explanation: string[];
  bolus?: number;
  monitoringFrequency: string;
  caution?: string;
}

export interface InitialInput {
  currentBG: number;
}

export interface AdjustmentInput {
  previousBG: number;
  currentBG: number;
  currentRate: number;
  hoursElapsed: number;
}
