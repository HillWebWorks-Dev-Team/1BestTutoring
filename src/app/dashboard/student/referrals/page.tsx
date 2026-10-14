import { CopyTextButton } from "@/components/dashboard/CopyTextButton";
import { appUrl } from "@/lib/brand";
import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "REWARDED") return "Credit earned";
  if (status === "SIGNED_UP") return "Signed up";
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function StudentReferralsPage() {
  const user = await requireRole(["STUDENT"]);
  const profile = user.studentProfile;
  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-5xl">Referrals</h1>
        <p className="mt-3 text-sm text-mute">Student profile required to use referrals.</p>
      </div>
    );
  }

  const db = await live();
  const [referrals, rewardLedger, settings] = await Promise.all([
    db.referral.findMany({
      where: { referrerUserId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.creditLedger.findMany({
      where: { studentId: profile.id, reason: "REFERRAL_REWARD" },
      orderBy: { createdAt: "desc" },
    }),
    db.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const referredIds = referrals.map((row) => row.referredUserId).filter((id): id is string => Boolean(id));
  const referredUsers = referredIds.length
    ? await db.user.findMany({
        where: { id: { in: referredIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const referredById = new Map(referredUsers.map((row) => [row.id, row]));

  const total = referrals.length;
  const rewarded = referrals.filter((row) => row.status === "REWARDED").length;
  const pending = referrals.filter((row) => row.status === "SIGNED_UP").length;
  const earnedCents = rewardLedger.reduce((sum, row) => sum + Math.max(0, row.deltaCents), 0);
  const balanceCents = profile.creditBalanceCents || 0;
  const rewardAmount = settings?.referralReferrerCreditCents ?? 1500;
  const sharePath = `/register?ref=${profile.referralCode}`;
  const shareUrl = `${appUrl()}${sharePath}`;

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="kicker">Referrals</p>
        <h1 className="mt-2 font-serif text-5xl">Invite friends</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
          Share your code. When someone you invite books their first paid session, you both get tutoring credit
          (applied automatically at checkout, from the platform fee - tutors still earn their full share).
        </p>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total referrals" value={String(total)} detail={`${pending} waiting on first paid session`} />
        <Stat label="Credits earned" value={money(earnedCents)} detail={`${rewarded} rewarded invite${rewarded === 1 ? "" : "s"}`} />
        <Stat label="Credit balance" value={money(balanceCents)} detail="Available at checkout" />
        <Stat label="Per reward" value={money(rewardAmount)} detail="When a friend’s first paid session completes" />
      </section>

      <section className="card mt-8 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="kicker">Your invite</p>
            <h2 className="mt-2 font-serif text-3xl text-navy">Share link</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
              Friends can register with your code, or open this link so the code fills in automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyTextButton value={profile.referralCode} label="Copy code" />
            <CopyTextButton value={shareUrl} label="Copy link" className="btn btn-primary text-sm" />
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-mute">Your code</dt>
            <dd className="font-semibold tracking-wide text-navy">{profile.referralCode}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <dt className="text-mute">Share link</dt>
            <dd className="max-w-full break-all text-right font-medium text-navy">{shareUrl}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8" id="list">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-3xl">Referred students</h2>
          <p className="text-sm text-mute">
            {total} total{pending ? ` · ${pending} pending` : ""}
          </p>
        </div>

        {referrals.length ? (
          <div className="card overflow-hidden">
            <div className="hidden border-b border-line bg-ivory px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-mute sm:grid sm:grid-cols-[1.4fr_1fr_0.9fr_0.9fr] sm:gap-4">
              <span>Student</span>
              <span>Joined</span>
              <span>Status</span>
              <span className="text-right">Rewarded</span>
            </div>
            <ul className="divide-y divide-line">
              {referrals.map((row) => {
                const referred = row.referredUserId ? referredById.get(row.referredUserId) : null;
                return (
                  <li
                    key={row.id}
                    className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1.4fr_1fr_0.9fr_0.9fr] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{referred?.name || "Pending signup"}</p>
                      <p className="truncate text-xs text-mute">{referred?.email || row.code}</p>
                    </div>
                    <p className="text-sm text-mute">{formatWhen(row.createdAt, user.timezone)}</p>
                    <p className="text-sm capitalize text-mute">{statusLabel(row.status)}</p>
                    <p className="text-sm font-semibold text-navy sm:text-right">
                      {row.rewardedAt ? formatWhen(row.rewardedAt, user.timezone) : "-"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-10 text-center text-sm text-mute">
            No referrals yet. Share your code or link to invite a friend.
          </div>
        )}
      </section>

      {rewardLedger.length ? (
        <section className="mt-8">
          <h2 className="font-serif text-3xl">Credit history</h2>
          <p className="mt-2 text-sm text-mute">Referral rewards added to your tutoring credit.</p>
          <ul className="card mt-4 divide-y divide-line overflow-hidden">
            {rewardLedger.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm">
                <div>
                  <p className="font-medium text-navy">{row.note || "Referral reward"}</p>
                  <p className="text-xs text-mute">{formatWhen(row.createdAt, user.timezone)}</p>
                </div>
                <p className="font-semibold text-navy">+{money(row.deltaCents)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
      <p className="mt-1 text-xs text-mute">{detail}</p>
    </div>
  );
}
