/** Platform commission math. Tutor share is never reduced by card-processing fees. */

export function splitAmount(priceCents: number, commissionPercent: number) {
  const safePrice = Math.max(0, Math.round(priceCents));
  const percent = Math.min(100, Math.max(0, commissionPercent));
  const platformShareCents = Math.round((safePrice * percent) / 100);
  const tutorShareCents = safePrice - platformShareCents;
  return { platformShareCents, tutorShareCents };
}

/**
 * Apply student referral credit as a platform subsidy.
 * Never reduces tutor share — credit is capped at platform commission.
 */
export function applySessionCredit(options: {
  priceCents: number;
  platformShareCents: number;
  tutorShareCents: number;
  creditBalanceCents: number;
}) {
  const creditCents = Math.min(
    Math.max(0, Math.round(options.creditBalanceCents)),
    Math.max(0, Math.round(options.platformShareCents)),
  );
  return {
    creditCents,
    chargeCents: Math.max(0, Math.round(options.priceCents) - creditCents),
    platformShareCents: Math.max(0, Math.round(options.platformShareCents) - creditCents),
    tutorShareCents: Math.round(options.tutorShareCents),
  };
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
