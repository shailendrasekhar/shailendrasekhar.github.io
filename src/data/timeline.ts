export type Stop = { when: string; role: string; org: string; where: string; current?: boolean };

export const timeline: Stop[] = [
  { when: '2025 – now', role: 'PhD, Computer Science', org: 'Robotics Research Center, IIIT Hyderabad', where: 'Hyderabad', current: true },
  { when: '2024 – 2025', role: 'Young Research Assistant', org: 'iHub-Data, IIIT Hyderabad', where: 'Hyderabad' },
  { when: '2024', role: 'Graduate Research Assistant', org: 'Heterogeneous Robotics Lab, University of Georgia', where: 'Athens, GA' },
  { when: '2021 – 2024', role: 'M.S. Artificial Intelligence', org: 'University of Georgia', where: 'Athens, GA' },
  { when: '2019', role: 'Data Science Intern', org: 'National University of Singapore', where: 'Singapore' },
  { when: '2015 – 2019', role: 'B.Tech, Electronics & Communication', org: 'GITAM University', where: 'Hyderabad' },
];

// LEGO builds for the About page. Drop photos in public/lego/ and list them here.
// Entries without `src` render as placeholders.
export type Build = { name: string; src?: string; note?: string };

export const builds: Build[] = [
  { name: 'First build', note: 'Photo coming soon' },
  { name: 'Second build', note: 'Photo coming soon' },
  { name: 'On the table now', note: 'Photo coming soon' },
];
