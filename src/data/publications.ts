export type Publication = {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  kind?: 'quiet';
  year: number;
  summary?: string;
  page?: string;
  links: { label: string; href: string }[];
};

export const ME = 'Shailendra Sekhar Bathula';

export const publications: Publication[] = [
  {
    id: 'imitation-bt',
    title: 'Imitation-BT: Automating Behavior Tree Generation by Echoing Reinforcement Learning Agents',
    authors: [ME, 'Ramviyas Parasuraman'],
    venue: 'ICRA 2026',
    year: 2026,
    summary:
      "Distils deep RL policies (DQN, PPO, A2C) into behavior trees you can read. Retains up to 100% of the expert's reward, often with an order of magnitude fewer nodes than prior BT synthesis.",
    page: '/research/imitation-bt/',
    links: [
      { label: 'PDF', href: 'https://herolab.org/wp-content/uploads/2026/06/Bathula___ICRA_2026___ImitationBT__Behavior_Trees_Learned_From_RL_Models_v2.pdf' },
      { label: 'Video', href: 'https://youtu.be/T25eTGvKuNM' },
    ],
  },
  {
    id: 'synthetic-instincts',
    title: 'Synthetic Instincts: Echoing Reinforcement Learning Agents for Behavior Tree Generation',
    authors: [ME],
    venue: 'M.S. Thesis',
    kind: 'quiet',
    year: 2024,
    summary: 'M.S. thesis, University of Georgia, advised by Prof. Ramviyas Parasuraman.',
    links: [{ label: 'Scholar', href: 'https://scholar.google.com/citations?user=WCKveKkAAAAJ&hl=en' }],
  },
];
