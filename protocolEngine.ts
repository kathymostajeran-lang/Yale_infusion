
import { ProtocolSection, CalculationResult, InitialInput, AdjustmentInput } from './types';

const roundToHalf = (num: number): number => {
  return Math.round(num * 2) / 2;
};

const getDelta = (rate: number): { d: number; d2: number } => {
  if (rate < 3.0) return { d: 0.5, d2: 1 };
  if (rate <= 6.0) return { d: 1, d2: 2 };
  if (rate <= 9.5) return { d: 1.5, d2: 3 };
  if (rate <= 14.5) return { d: 2, d2: 4 };
  if (rate <= 19.5) return { d: 3, d2: 6 };
  return { d: 4, d2: 8 };
};

export const calculateInitialRate = (input: InitialInput): CalculationResult => {
  const { currentBG } = input;
  const rawValue = currentBG / 100;
  const roundedValue = roundToHalf(rawValue);

  return {
    section: ProtocolSection.INITIAL,
    action: `Administer IV bolus and start infusion.`,
    newRate: roundedValue,
    bolus: roundedValue,
    monitoringFrequency: "Check BG hourly until stable (3 consecutive in target 120-160).",
    explanation: [
      `Rule 7: Divide initial BG (${currentBG}) by 100 = ${rawValue.toFixed(2)}.`,
      `Rule 7: Round to nearest 0.5 units for bolus AND initial infusion rate = ${roundedValue}.`
    ],
    caution: currentBG > 500 ? "Caution: Initial orders should be reviewed with MD for BG > 500 mg/dL." : undefined
  };
};

export const calculateAdjustmentRate = (input: AdjustmentInput): CalculationResult => {
  const { currentBG, previousBG, currentRate, hoursElapsed } = input;
  const hourlyChange = (currentBG - previousBG) / hoursElapsed;
  const { d, d2 } = getDelta(currentRate);

  // Hypoglycemia cases (< 100)
  if (currentBG < 50) {
    return {
      section: ProtocolSection.HYPOGLYCEMIA,
      action: "D/C INSULIN INFUSION",
      newRate: "0 (Off)",
      monitoringFrequency: "Recheck BG q 15 min until ≥90 mg/dL.",
      explanation: [
        "Rule: If BG < 50 mg/dL: D/C INSULIN INFUSION & administer 1 amp (25 g) D50 IV.",
        "Rule: Recheck BG q 15 minutes until ≥90 mg/dl.",
        `Rule: When ≥140 mg/dL, wait 30 min, restart insulin infusion at 50% of most recent rate (${(currentRate * 0.5).toFixed(1)} units/hr).`
      ]
    };
  }

  if (currentBG >= 50 && currentBG <= 74) {
    return {
      section: ProtocolSection.HYPOGLYCEMIA,
      action: "D/C INSULIN INFUSION",
      newRate: "0 (Off)",
      monitoringFrequency: "Recheck BG q 15 min until ≥90 mg/dL.",
      explanation: [
        "Rule: If BG 50-74 mg/dL: D/C INSULIN INFUSION & administer 1/2 Amp (12.5 g) D50 IV.",
        "Rule: Recheck BG q 15 minutes until ≥90 mg/dl.",
        `Rule: When ≥140 mg/dL, wait 30 min, restart insulin infusion at 50% of most recent rate (${(currentRate * 0.5).toFixed(1)} units/hr).`
      ]
    };
  }

  if (currentBG >= 75 && currentBG <= 99) {
    return {
      section: ProtocolSection.HYPOGLYCEMIA,
      action: "D/C INSULIN INFUSION",
      newRate: "0 (Off)",
      monitoringFrequency: "Recheck BG q 15 min until reaches or remains ≥90 mg/dL.",
      explanation: [
        "Rule: If BG 75-99 mg/dL: D/C INSULIN INFUSION.",
        "Rule: Recheck BG q 15 minutes until BG reaches or remains ≥90 mg/dl.",
        `Rule: When ≥140 mg/dL, wait 30 min, restart infusion at 75% of most recent rate (${(currentRate * 0.75).toFixed(1)} units/hr).`
      ]
    };
  }

  // Rapid fall section † for 100-119
  if (currentBG >= 100 && currentBG <= 119 && hourlyChange < -20) {
    return {
      section: ProtocolSection.RAPID_FALL_WARNING,
      action: "D/C INSULIN INFUSION (Section †)",
      newRate: "0 (Off)",
      monitoringFrequency: "Recheck BG in 15 min to be sure ≥90 mg/dL.",
      explanation: [
        `Section †: BG 100-119 mg/dL and BG falling by > 20 mg/dL/hr (Current fall: ${Math.abs(hourlyChange).toFixed(1)} mg/dL/hr).`,
        "Rule: D/C INSULIN INFUSION; √BG in 15 min to be sure ≥90 mg/dL. Then recheck BG q 1 hr.",
        `Rule: When ≥140 mg/dL, restart infusion @ 75% of most recent rate (${(currentRate * 0.75).toFixed(1)} units/hr).`
      ]
    };
  }

  // Main Adjustment Table (BG >= 100)
  let actionStr = "";
  let rateChange = 0;
  let holdTime = 0;

  if (currentBG >= 100 && currentBG <= 119) {
    if (hourlyChange > 0) { actionStr = "NO INFUSION CHANGE"; rateChange = 0; }
    else if (hourlyChange === 0 || (hourlyChange < 0 && hourlyChange >= -20)) { actionStr = "↓ INFUSION by Δ"; rateChange = -d; }
  } 
  else if (currentBG >= 120 && currentBG <= 159) {
    if (hourlyChange > 40) { actionStr = "↑ INFUSION by Δ"; rateChange = d; }
    else if ((hourlyChange >= 1 && hourlyChange <= 40) || hourlyChange === 0 || (hourlyChange < 0 && hourlyChange >= -20)) { actionStr = "NO INFUSION CHANGE"; rateChange = 0; }
    else if (hourlyChange < -20 && hourlyChange >= -40) { actionStr = "↓ INFUSION by Δ"; rateChange = -d; }
    else if (hourlyChange < -40) { actionStr = "HOLD x 30 min, then ↓ INFUSION by 2Δ"; rateChange = -d2; holdTime = 30; }
  }
  else if (currentBG >= 160 && currentBG <= 199) {
    if (hourlyChange > 60) { actionStr = "↑ INFUSION by 2Δ"; rateChange = d2; }
    else if (hourlyChange >= 1 && hourlyChange <= 60 || hourlyChange === 0) { actionStr = "↑ INFUSION by Δ"; rateChange = d; }
    else if (hourlyChange < 0 && hourlyChange >= -40) { actionStr = "NO INFUSION CHANGE"; rateChange = 0; }
    else if (hourlyChange < -40 && hourlyChange >= -60) { actionStr = "↓ INFUSION by Δ"; rateChange = -d; }
    else if (hourlyChange < -60) { actionStr = "HOLD x 30 min, then ↓ INFUSION by 2Δ"; rateChange = -d2; holdTime = 30; }
  }
  else if (currentBG >= 200) {
    if (hourlyChange > 0) { actionStr = "↑ INFUSION by 2Δ"; rateChange = d2; }
    else if (hourlyChange === 0 || (hourlyChange < 0 && hourlyChange >= -20)) { actionStr = "↑ INFUSION by Δ"; rateChange = d; }
    else if (hourlyChange < -20 && hourlyChange >= -60) { actionStr = "NO INFUSION CHANGE"; rateChange = 0; }
    else if (hourlyChange < -60 && hourlyChange >= -80) { actionStr = "↓ INFUSION by Δ"; rateChange = -d; }
    else if (hourlyChange < -80) { actionStr = "HOLD x 30 min, then ↓ INFUSION by 2Δ"; rateChange = -d2; holdTime = 30; }
  }

  if (!actionStr) {
     return {
        section: ProtocolSection.ADJUSTMENT,
        action: "Clinical assessment required",
        newRate: "N/A",
        monitoringFrequency: "Hourly",
        explanation: ["Explanation not available: this instruction is not explicitly stated in the uploaded protocol."]
     };
  }

  const newRateValue = Math.max(0, currentRate + rateChange);

  return {
    section: ProtocolSection.ADJUSTMENT,
    action: actionStr,
    newRate: newRateValue,
    monitoringFrequency: "Check BG hourly until stable (3 consecutive in target 120-160).",
    explanation: [
      `Step 1: Current BG ${currentBG} mg/dL identified column.`,
      `Step 2: Hourly Rate of Change is ${hourlyChange.toFixed(1)} mg/dL/hr.`,
      `Step 3: Current rate ${currentRate} units/hr defines Δ = ${d}, 2Δ = ${d2}.`,
      `Result: Instruction is "${actionStr}".`,
      holdTime > 0 ? `Hold infusion for ${holdTime} minutes before starting new rate.` : `Change rate from ${currentRate} to ${newRateValue} units/hr.`
    ]
  };
};
