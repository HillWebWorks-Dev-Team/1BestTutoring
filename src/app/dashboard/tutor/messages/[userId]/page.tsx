import TutorMessages from "../page";

export const dynamic = "force-dynamic";
export default function Page({ params }: { params: Promise<{ userId: string }> }) {
  return <TutorMessages params={params} />;
}
