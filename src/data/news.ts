// Newest first. `date` is YYYY-MM, or YYYY when the month is unknown.
// `html` may contain links. Mark at most one item `isNew`, for about 60 days.
export type NewsItem = { date: string; html: string; isNew?: boolean };

export const news: NewsItem[] = [
  {
    date: '2026-06',
    html: '<a href="/research/imitation-bt/">Imitation-BT</a> appears at ICRA 2026 in Vienna.',
  },
  {
    date: '2025',
    html: 'Started my PhD at the Robotics Research Center, IIIT Hyderabad, with Prof. K. Madhava Krishna.',
  },
  {
    date: '2024-12',
    html: 'Joined iHub-Data, IIIT Hyderabad, as a Young Research Assistant.',
  },
  {
    date: '2024-08',
    html: 'Finished my M.S. in Artificial Intelligence at the University of Georgia.',
  },
  {
    date: '2024-01',
    html: 'Joined the Heterogeneous Robotics Lab at UGA as a Graduate Research Assistant.',
  },
];
