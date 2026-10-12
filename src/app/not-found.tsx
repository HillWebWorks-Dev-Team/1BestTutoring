import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="kicker">Missing page</p>
      <h1 className="display mt-4 text-6xl text-navy">That page isn’t on the desk.</h1>
      <Link href="/" className="btn btn-primary mt-8">
        Back home
      </Link>
    </div>
  );
}
