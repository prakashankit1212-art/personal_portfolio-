export type PortfolioLink = {
  label: string;
  href: string;
};

export type PortfolioProject = {
  name: string;
  kind: string;
  description: string;
  stack: string[];
  challenge: string;
  status: string;
  contribution: string;
  repository?: string;
  demo?: string;
};

export const portfolioIdentity = {
  fullName: "Ankit Prakash",
  displayName: "Ankit",
  title: "Full-Stack Developer | AI/ML Enthusiast",
  location: "Raigarh, Chhattisgarh, India",
  email: "prakashankit1212@gmail.com",
  phone: "8235193006",
  computerName: "ANKIT.EXE",
  terminalPrompt: "C:\\ANKIT>",
  welcomeMessage: "Welcome to ANKIT.EXE — Personal Desktop System.",
  introduction: "I am a Computer Science and Engineering student at OP Jindal University who enjoys building interactive web applications, exploring AI/ML technologies, and solving practical software development problems.",
  interests: "Full-stack development · real-time applications · developer tools · AI-powered systems",
} as const;

export const portfolioLinks = {
  github: {
    label: "GitHub",
    href: "https://github.com/prakashankit1212-art",
  },
  linkedin: {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ankit-prakash-1a049131b/",
  },
} satisfies Record<string, PortfolioLink>;

export const portfolioProjects: PortfolioProject[] = [
  {
    name: "Scribble Arena",
    kind: "Real-time multiplayer game",
    description: "A real-time drawing and guessing game with rooms, synchronized drawing, timed rounds, hints, and scoring.",
    stack: ["React", "TypeScript", "Vite", "Node.js", "Express", "Socket.IO", "Zod"],
    challenge: "Keeping game state synchronized while multiple players draw, guess, and move through rounds. Rooms are currently stored in memory.",
    status: "Demo listed — multiplayer flow pending verification",
    contribution: "Confirm personal contribution before publishing.",
    repository: "https://github.com/prakashankit1212-art/scribble-arena",
    demo: "https://scribble-arena.vercel.app/",
  },
  {
    name: "PneumoScan AI",
    kind: "Applied AI/ML project",
    description: "A pneumonia and chest X-ray classification project with a web interface and documented deployment direction.",
    stack: ["React", "Python", "Computer vision", "X-ray classification"],
    challenge: "Documenting the model, dataset, evaluation metrics, and backend framework without overstating medical performance.",
    status: "AI/ML candidate — model and deployment evidence pending",
    contribution: "Confirm model, dataset, API, deployment, and personal contribution.",
    repository: "https://github.com/prakashankit1212-art/pneumoscan-ai",
  },
  {
    name: "Society",
    kind: "Full-stack management app",
    description: "A society and mess-management application covering menu, feedback, and community workflows.",
    stack: ["React", "Vite", "Node.js", "Express", "Socket.IO"],
    challenge: "Connecting practical user workflows across the client and server while keeping roles and real-time behavior understandable.",
    status: "Full-stack candidate — flow and deployment pending verification",
    contribution: "Confirm implementation role and current client/server boundary.",
    repository: "https://github.com/prakashankit1212-art/society",
  },
];
