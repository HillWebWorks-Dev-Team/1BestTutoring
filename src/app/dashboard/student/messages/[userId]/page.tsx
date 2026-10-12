import StudentMessages from "../page";

export const dynamic = "force-dynamic";

export default function ThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  return <StudentMessages params={params} />;
}
