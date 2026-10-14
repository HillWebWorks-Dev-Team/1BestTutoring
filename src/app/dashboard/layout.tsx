import { DashboardShell, type DashLink } from "@/components/dashboard/Shell";
import { paymentsMode } from "@/lib/brand";
import { live } from "@/lib/live";
import { getSession, isImpersonating, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function linksFor(role: string, pendingTutor: boolean, unreadMessages = 0): DashLink[] {
  if (role === "ADMIN") {
    return [
      { href: "/dashboard/admin", label: "Overview" },
      { href: "/dashboard/admin/tutors", label: "Tutors" },
      { href: "/dashboard/admin/applications", label: "Applications" },
      { href: "/dashboard/admin/students", label: "Students" },
      { href: "/dashboard/admin/assignments", label: "Assignments" },
      { href: "/dashboard/admin/bookings", label: "Sessions" },
      { href: "/dashboard/admin/finance", label: "Payments" },
      { href: "/dashboard/admin/analytics", label: "Analytics" },
      { href: "/dashboard/admin/inbox", label: "Inbox" },
      { href: "/dashboard/admin/reviews", label: "Reviews" },
      { href: "/dashboard/admin/safety", label: "Safety" },
      { href: "/dashboard/admin/settings", label: "Settings" },
    ];
  }
  if (role === "TUTOR") {
    return [
      { href: "/dashboard/tutor", label: "Overview" },
      { href: "/dashboard/tutor/application", label: "Application" },
      { href: "/dashboard/tutor/students", label: "My students", locked: pendingTutor },
      { href: "/dashboard/tutor/calendar", label: "Calendar", locked: pendingTutor },
      { href: "/dashboard/tutor/messages", label: "Messages", locked: pendingTutor, badge: unreadMessages || undefined },
      { href: "/dashboard/tutor/homework", label: "Assignments", locked: pendingTutor },
      { href: "/dashboard/tutor/earnings", label: "Earnings", locked: pendingTutor },
      { href: "/dashboard/tutor/availability", label: "Availability", locked: pendingTutor },
      { href: "/dashboard/tutor/profile", label: "Profile", locked: pendingTutor },
      { href: "/dashboard/tutor/settings", label: "Settings" },
    ];
  }
  if (role === "PARENT") {
    return [
      { href: "/dashboard/parent", label: "Family" },
      { href: "/dashboard/parent/calendar", label: "Calendar" },
      { href: "/dashboard/parent/progress", label: "Progress" },
      { href: "/dashboard/parent/billing", label: "Billing" },
      { href: "/dashboard/parent/settings", label: "Settings" },
    ];
  }
  return [
    { href: "/dashboard/student", label: "Overview" },
    { href: "/dashboard/student/tutors", label: "My tutors" },
    { href: "/dashboard/student/calendar", label: "Calendar" },
    { href: "/dashboard/student/reviews", label: "Reviews" },
    { href: "/dashboard/student/messages", label: "Messages", badge: unreadMessages || undefined },
    { href: "/dashboard/student/homework", label: "Homework" },
    { href: "/dashboard/student/progress", label: "Learning progress" },
    { href: "/dashboard/student/payments", label: "Payments" },
    { href: "/dashboard/student/settings", label: "Settings" },
  ];
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const session = await getSession();
  const db = await live();
  const [unread, unreadMessages] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.message.count({ where: { recipientId: user.id, readAt: null } }),
  ]);
  const pendingTutor = user.role === "TUTOR" && user.tutorProfile?.status !== "APPROVED";
  return (
    <DashboardShell
      name={user.name}
      role={user.role.toLowerCase()}
      links={linksFor(user.role, pendingTutor, unreadMessages)}
      unread={unread}
      demo={paymentsMode() === "demo"}
      viewingAs={
        isImpersonating(session)
          ? { adminName: session?.impersonatorName || "Admin" }
          : null
      }
    >
      {children}
    </DashboardShell>
  );
}
