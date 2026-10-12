import { MessageDesk } from "@/components/dashboard/MessageDesk";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudentMessages({ params }: { params?: Promise<{ userId: string }> }) {
  const user = await requireUser();
  const otherId = params ? (await params).userId : undefined;
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="kicker">Inbox</p>
        <h1 className="mt-2 font-serif text-5xl">Messages</h1>
        <p className="mt-2 text-sm text-mute">Chat with your assigned tutors about sessions, homework, and next steps.</p>
      </div>
      <MessageDesk userId={user.id} role="STUDENT" otherId={otherId} timeZone={user.timezone} />
    </div>
  );
}
