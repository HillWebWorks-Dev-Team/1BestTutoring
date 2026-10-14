import { Suspense } from "react";
import Link from "next/link";
import { getHomePayload } from "@/lib/home";
import { portraitFor } from "@/lib/portraits";
import styles from "./HomeHero.module.css";

async function HeroReview() {
  const { reviews, tutors } = await getHomePayload();
  const published = reviews.find((item) => item.comment.trim());
  if (!published) return null;

  const portraits = tutors
    .map((tutor) => ({
      id: tutor.id,
      name: tutor.user.name,
      src: portraitFor(tutor.slug, tutor.user.imageUrl, tutor.user.name),
    }))
    .filter((tutor) => Boolean(tutor.src))
    .slice(0, 3);

  return (
    <figure className={styles.testimonial}>
      {portraits.length ? (
        <div className={styles.avatars} aria-hidden="true">
          {portraits.map((tutor) => (
            <img key={tutor.id} src={tutor.src!} alt="" width={36} height={36} />
          ))}
        </div>
      ) : null}
      <blockquote>“{published.comment}”</blockquote>
      <p className={styles.stars} aria-label={`${published.rating} out of 5 stars`}>
        {"★".repeat(Math.max(1, Math.min(5, published.rating)))}
        {published.rating < 5 ? "☆".repeat(5 - published.rating) : null}
      </p>
      <figcaption>
        <strong>{published.author.name}</strong>
        <span>Student · session with {published.tutor.user.name}</span>
      </figcaption>
    </figure>
  );
}

export function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-heading">
      <div className={styles.media} aria-hidden="true">
        <img
          className={styles.image}
          src="/images/tutoring-hero.png"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className={styles.copy}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Personalised online tutoring</p>
          <h1 id="home-hero-heading" className={styles.heading}>
            Get 1% Better Every Day.
          </h1>
          <p className={styles.subtitle}>Expert tutors. Real progress. A brighter future.</p>
          <p className={styles.description}>
            Connect with verified tutors from the Ivy League and other leading universities. Meet for a free
            consultation, then continue only after we confirm the match.
          </p>
          <div className={styles.actions}>
            <Link href="/tutors" className={`btn btn-primary ${styles.button}`}>
              Find a tutor
            </Link>
            <Link href="/how-it-works" className={`btn btn-line ${styles.button} ${styles.secondary}`}>
              How it works
            </Link>
          </div>
          <ul className={styles.trust}>
            {["Verified tutors", "Personalised learning", "Flexible sessions"].map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Suspense fallback={null}>
        <HeroReview />
      </Suspense>
    </section>
  );
}
