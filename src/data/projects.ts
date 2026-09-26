export type Project = {
  title: string;
  description: string;
  stack: string[];
  links: { label: string; href: string }[];
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: 'MonoLayout2.0',
    description: "Bird's-eye road and vehicle layout from a single camera image, brought up to date with current PyTorch and Pillow.",
    stack: ['PyTorch', 'ResNet', 'Argoverse'],
    links: [{ label: 'Code', href: 'https://github.com/shailendrasekhar/monolayout2' }],
    featured: true,
  },
  {
    title: 'Mobile Robotics in 3D',
    description: 'Interactive explainers for Euler angles, quaternions and coordinate frames, built for a mobile robotics course.',
    stack: ['Three.js', 'dat.GUI', 'JavaScript'],
    links: [{ label: 'Code', href: 'https://github.com/shailendrasekhar/robotics-3d-visualizations' }],
    featured: true,
  },
  {
    title: 'Akshara',
    description:
      'A Linux PDF reader for long sessions: neural text-to-speech with sentence highlighting, a Pomodoro timer and reading analytics.',
    stack: ['PyQt6', 'PyMuPDF', 'Kokoro-82M', 'SQLite'],
    links: [{ label: 'Code', href: 'https://github.com/shailendrasekhar/akshara' }],
    featured: true,
  },
  {
    title: 'Rod navigation environment',
    description:
      'A Gymnasium environment where a rigid rod has to pass through a narrow gap between two obstacles. A small testbed for MPC and reinforcement learning.',
    stack: ['Gymnasium', 'NumPy', 'Matplotlib'],
    links: [{ label: 'Code', href: 'https://github.com/shailendrasekhar/rl_mpc' }],
  },
  {
    title: 'Franka Panda pick and place',
    description: 'Object detection and pick-and-place for the Franka Emika Panda arm, with RealSense depth perception and MoveIt 2 planning.',
    stack: ['ROS 2', 'MoveIt 2', 'C++', 'Python', 'Gazebo'],
    links: [{ label: 'Code', href: 'https://github.com/shailendrasekhar/pick_place' }],
  },
  {
    title: 'Multi-robot task allocation',
    description: 'Decentralised task allocation for robot teams on the Robotarium platform.',
    stack: ['Python', 'Robotarium'],
    links: [{ label: 'Code', href: 'https://github.com/shailendrasekhar/TaskAllocation' }],
  },
];
