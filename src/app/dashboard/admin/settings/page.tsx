import { Notice } from "@/components/ui";
import { platformSettings } from "@/lib/live";
import { updatePlatformSettings } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const query = await searchParams;
  const settings = await platformSettings();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-5xl">Platform settings</h1>
      <p className="mt-3 text-sm leading-6 text-mute">Commission changes apply to future bookings only. Prices already purchased stay on the booking record. Tutors cannot edit this number.</p>
      <div className="my-4"><Notice error={query.error} success={query.saved ? "Settings saved." : undefined} /></div>
      <form action={updatePlatformSettings} className="grid gap-4">
        <label className="label">Platform commission %</label>
        <input className="field" name="commissionPercent" type="number" min="0" max="60" defaultValue={settings.commissionPercent} />
        <label className="label">Minimum hourly rate (USD)</label>
        <input className="field" name="minRate" type="number" defaultValue={settings.minHourlyRateCents / 100} />
        <label className="label">Maximum hourly rate (USD)</label>
        <input className="field" name="maxRate" type="number" defaultValue={settings.maxHourlyRateCents / 100} />
        <label className="label">Consultation minutes</label>
        <input className="field" name="consultationMinutes" type="number" defaultValue={settings.consultationMinutes} />
        <label className="label">Session minutes</label>
        <input className="field" name="sessionMinutes" type="number" defaultValue={settings.sessionMinutes} />
        <label className="label">Free-cancel window (hours)</label>
        <input className="field" name="cancelWindowHours" type="number" defaultValue={settings.cancelWindowHours} />
        <label className="label">Referral reward — referrer (USD)</label>
        <input
          className="field"
          name="referrerCredit"
          type="number"
          min="0"
          step="1"
          defaultValue={settings.referralReferrerCreditCents / 100}
        />
        <label className="label">Referral reward — new student (USD)</label>
        <input
          className="field"
          name="refereeCredit"
          type="number"
          min="0"
          step="1"
          defaultValue={settings.referralRefereeCreditCents / 100}
        />
        <p className="text-xs text-mute">
          Credits grant after a referred student’s first paid session. They reduce what the family pays and come from
          platform commission — tutor payouts stay whole. Fee policy: {settings.feePolicy}.
        </p>
        <button className="btn btn-primary w-fit" type="submit">Save</button>
      </form>
    </div>
  );
}
