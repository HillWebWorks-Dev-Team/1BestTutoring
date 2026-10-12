export const FAQS = [
  {
    question: "How is this different from a tutoring marketplace?",
    answer:
      "You can browse every approved tutor and book a free 15-minute consultation yourself. Ongoing paid tutoring starts only after our team reviews the fit and officially assigns the tutor. That keeps relationships intentional, supervised, and tied to a real plan.",
  },
  {
    question: "Are the consultations really free?",
    answer:
      "Yes. Every approved tutor offers a 15-minute introductory Zoom consultation at no charge. You choose a time on their calendar, and both of you receive a confirmation. Paid sessions are available only after you are assigned to that tutor.",
  },
  {
    question: "How do payments work?",
    answer:
      "Tutoring is pay-per-hour. There is no required monthly subscription. Tutors set their own hourly rates. When you book a session, the price is locked in. By default, 70% goes to the tutor and 30% stays with 1% Better Tutoring. Card processing is handled by Stripe Connect.",
  },
  {
    question: "Do you represent the universities on the site?",
    answer:
      "No. University names and monograms tell you where a tutor studied. We are not affiliated with, endorsed by, or sponsored by those schools, and we only display schools that have at least one verified tutor on the platform.",
  },
  {
    question: "Can a tutor sign up and start teaching immediately?",
    answer:
      "No. Tutors apply, join a review queue, and stay on the waitlist until we verify their materials and approve them. Applicants can sign in to check their status, but they are not visible in the directory and cannot take students until approval.",
  },
  {
    question: "Can parents be involved?",
    answer:
      "Yes. A parent can create an account, link a student, and follow sessions, homework, progress, and payments. Students who are minors can add a guardian email during registration so our team can connect the accounts.",
  },
  {
    question: "What happens if I need to cancel?",
    answer:
      "Consultations and tutoring sessions can be cancelled or rescheduled from your dashboard. Paid sessions cancelled with enough notice are refunded. Inside the late window, our team reviews the request so tutors are not left holding an empty hour.",
  },
  {
    question: "Where do Zoom links and calendar events come from?",
    answer:
      "Sessions are booked on our calendar, not through Calendly. When Zoom is connected, a meeting link is created automatically. Every booking can also be added to Apple, Google, or Outlook through a calendar file, and Google Calendar sync is available once an account is connected.",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "The consultation felt like a real academic meeting, not a sales call. We knew within fifteen minutes that the match was right, and the admin team confirmed it the same day.",
    name: "Elena V.",
    detail: "Parent of an 11th grader · AP Calculus",
  },
  {
    quote:
      "I stopped guessing which tutor to hire. Profiles show the university, the rate, and the actual subjects. After we were assigned, homework and notes lived in one place.",
    name: "Chris M.",
    detail: "College freshman · Economics",
  },
  {
    quote:
      "Teaching here feels like a practice, not a gig app. My students are assigned, my rate is mine, and I can see exactly what I earn after each hour.",
    name: "A licensed tutor",
    detail: "Harvard · Economics",
  },
];

export const SUBJECT_COPY: Record<string, string> = {
  Mathematics: "Algebra through multivariable calculus, proofs, and contest-level problem solving.",
  Physics: "Mechanics, electricity and magnetism, and the reasoning AP and college courses actually test.",
  Chemistry: "General, organic, and honors chemistry with an emphasis on mechanisms and lab thinking.",
  Biology: "From foundational biology to neuroscience, with help turning dense material into a study system.",
  "Computer Science": "Intro programming, data structures, algorithms, and school projects explained clearly.",
  Economics: "Micro, macro, and the graphs, models, and writing that upper-level courses expect.",
  English: "Close reading, essays, and the kind of revision that makes an argument sharper.",
  History: "Document work, timelines, and essays that hold a point of view without losing the evidence.",
  "SAT / ACT Prep": "Targeted practice with tutors who recently sat at the top of these exams.",
  "College Essays": "Voice-first editing from people who just went through highly selective admissions.",
};

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Find your tutor",
    body: "Filter by subject, university, rate, grade level, and who actually has open consultation times.",
  },
  {
    step: "02",
    title: "Book a free consultation",
    body: "Pick a 15-minute Zoom slot on the tutor’s own calendar. No Calendly redirect, no charge.",
  },
  {
    step: "03",
    title: "Get matched",
    body: "If you want to continue, request the tutor. Our team assigns the relationship. Tutors cannot assign themselves.",
  },
  {
    step: "04",
    title: "Start learning",
    body: "Book paid sessions, share work, read feedback, and pay only for the hours you schedule.",
  },
];
