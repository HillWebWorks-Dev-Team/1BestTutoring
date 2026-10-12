import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ParentBilling() {
  const user = await requireUser();
  const db = await live();
  const students = await db.studentProfile.findMany({ where: { parentId: user.parentProfile?.id || "" } });
  const transactions = await db.transaction.findMany({
    where: { booking: { studentId: { in: students.map((student) => student.id) } } },
    include: { booking: { include: { student: { include: { user: true } }, tutor: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const total = transactions.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + item.amountCents, 0);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Billing</h1>
      <p className="mt-3 font-serif text-4xl">{money(total)}</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="py-2">Date</th><th>Student</th><th>Tutor</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="py-3">{formatWhen(item.createdAt, user.timezone, false)}</td>
                <td>{item.booking.student.user.name}</td>
                <td>{item.booking.tutor.user.name}</td>
                <td>{money(item.amountCents)}</td>
                <td>{item.status.toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
