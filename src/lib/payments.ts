/** Platform commission math. Tutor share is never reduced by card-processing fees. */

export function splitAmount(priceCents: number, commissionPercent: number) {
  const safePrice = Math.max(0, Math.round(priceCents));
  const percent = Math.min(100, Math.max(0, commissionPercent));
  const platformShareCents = Math.round((safePrice * percent) / 100);
  const tutorShareCents = safePrice - platformShareCents;
  return { platformShareCents, tutorShareCents };
}

/** Stripe's standard online card rate: 2.9% + 30¢. Actual fees are stored from webhooks when available. */
export function estimateProcessingFee(amountCents: number) {
  if (amountCents <= 0) return 0;
  return Math.round(amountCents * 0.029) + 30;
}

export function netPlatformEarnings(platformShareCents: number, feeCents: number) {
  return platformShareCents - feeCents;
}

export function sessionPrice(hourlyRateCents: number, durationMin: number) {
  return Math.round((hourlyRateCents * durationMin) / 60);
}
