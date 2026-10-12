import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <Header signedIn={Boolean(session)} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
