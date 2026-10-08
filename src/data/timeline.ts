import type { ImageMetadata } from 'astro';
import portraitImg from '../assets/about/portrait.webp';
import museum from '../assets/about/museum.webp';
import redwoods from '../assets/about/redwoods.webp';
import shakey from '../assets/about/shakey.webp';

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

// Photos on the About page. Files live in src/assets/about/ and are resized at build time.
// The portrait is shown whole, uncropped; the photo strip is 3:4.
export const portrait = {
  src: portraitImg,
  alt: 'An illustrated portrait of Shailendra, smiling in glasses and a striped T-shirt, beside the bronze IEEE Milestone plaque for SHAKEY, the first mobile intelligent robot, on a brick wall.',
  caption: 'Illustrated, beside the IEEE Milestone plaque for SHAKEY.',
};

export type Photo = { src: ImageMetadata; alt: string; caption: string };

export const photos: Photo[] = [
  {
    src: museum,
    alt: 'Shailendra in the Computer History Museum, under an arch of lit-up panels from computing history.',
    caption: 'Computer History Museum, Mountain View',
  },
  {
    src: redwoods,
    alt: 'Shailendra standing inside the hollow trunk of a giant redwood in a forest.',
    caption: 'Inside a hollow redwood, on a hike',
  },
  {
    src: shakey,
    alt: 'Shailendra smiling beside SHAKEY the robot in its glass display case.',
    caption: 'With SHAKEY, the first mobile robot that could reason about its own actions',
  },
];
