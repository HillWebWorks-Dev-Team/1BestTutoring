const PORTRAITS: Record<string, string> = {
  "maya-chen": "/images/portrait-maya.jpg",
  "james-okonkwo": "/images/portrait-james.jpg",
  "sofia-alvarez": "/images/portrait-sofia.jpg",
  "ethan-park": "/images/portrait-ethan.jpg",
  "amelia-wright": "/images/portrait-amelia.jpg",
  "noah-goldberg": "/images/portrait-noah.jpg",
  "priya-shah": "/images/portrait-priya.jpg",
  "hannah-kim": "/images/portrait-hannah.jpg",
  "omar-hassan": "/images/portrait-omar.jpg",
  "claire-dubois": "/images/portrait-claire.jpg",
  "benjamin-adler": "/images/portrait-benjamin.jpg",
  "aisha-rahman": "/images/portrait-aisha.jpg",
  // Demo students
  "jordan-hale": "/images/portrait-jordan.jpg",
  "alex-rivera": "/images/portrait-alex.jpg",
  "sam-patel": "/images/portrait-sam.jpg",
  "riley-chen": "/images/portrait-riley.jpg",
  "jordan@onepercentbetter.com": "/images/portrait-jordan.jpg",
  "alex@onepercentbetter.com": "/images/portrait-alex.jpg",
  "sam@onepercentbetter.com": "/images/portrait-sam.jpg",
  "riley@onepercentbetter.com": "/images/portrait-riley.jpg",
};

function slugFromName(name?: string | null) {
  if (!name) return null;
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function portraitFor(slugOrEmail?: string | null, imageUrl?: string | null, name?: string | null) {
  if (imageUrl) return imageUrl;
  if (slugOrEmail && PORTRAITS[slugOrEmail]) return PORTRAITS[slugOrEmail];
  const fromName = slugFromName(name);
  if (fromName && PORTRAITS[fromName]) return PORTRAITS[fromName];
  return null;
}
