/** Newton IRR matching Excel IRR(values, guess). */
export function irr(cashFlows: number[], guess = 0.1): number | null {
  if (cashFlows.length < 2) return null;
  const hasPos = cashFlows.some((v) => v > 0);
  const hasNeg = cashFlows.some((v) => v < 0);
  if (!hasPos || !hasNeg) return null;

  let rate = guess;
  for (let i = 0; i < 80; i++) {
    let npv = 0;
    let deriv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      const denom = (1 + rate) ** t;
      npv += cf / denom;
      if (t > 0) deriv += (-t * cf) / (1 + rate) ** (t + 1);
    }
    if (Math.abs(deriv) < 1e-18) break;
    const next = rate - npv / deriv;
    if (!Number.isFinite(next) || next <= -0.999999) return null;
    if (Math.abs(next - rate) < 1e-14) {
      rate = next;
      break;
    }
    rate = next;
  }
  return Number.isFinite(rate) ? rate : null;
}

/** Excel: Y0 undiscounted + NPV(rate, Y1:Yn). */
export function npv(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((sum, cf, t) => {
    if (t === 0) return sum + cf;
    return sum + cf / (1 + rate) ** t;
  }, 0);
}

/** First year cumulative NCF crosses zero, interpolated. */
export function paybackYears(cashFlows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const prev = cumulative;
    cumulative += cashFlows[t];
    if (t > 0 && cumulative >= 0) {
      if (cashFlows[t] === 0) return t;
      return t - 1 + -prev / cashFlows[t];
    }
  }
  return null;
}

export function combinedTax(federalTax: number, stateTax: number): number {
  return 1 - (1 - federalTax) * (1 - stateTax);
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
