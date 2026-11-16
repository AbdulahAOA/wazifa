import type { ApplicationStatus, EmploymentType, ExperienceLevel } from "@/lib/types";

export type SeedJob = {
  id: string;
  title: string;
  company: string;
  companyTag: string;
  location: string;
  salary: string;
  salaryMin: number;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  remote: boolean;
  category: string;
  featured: boolean;
  postedAt: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
};

export type SeedApplication = {
  id: string;
  jobId: string;
  candidateName: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: ApplicationStatus;
  coverLetter: string;
};

export const categories = [
  { name: "Engineering", count: 48, color: "bg-electric" },
  { name: "Design", count: 21, color: "bg-cobalt text-white" },
  { name: "Product", count: 16, color: "bg-coral text-white" },
  { name: "Data", count: 19, color: "bg-ink text-white" },
  { name: "Marketing", count: 12, color: "bg-electric" },
  { name: "Operations", count: 9, color: "bg-pale" },
] as const;

export const locations = [
  "Cairo",
  "Remote",
  "Alexandria",
  "Dubai",
  "Berlin",
  "London",
];

export const jobs: SeedJob[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Northgrid",
    companyTag: "NG",
    location: "Cairo",
    salary: "$72k – $96k",
    salaryMin: 72000,
    employmentType: "Full-time",
    experienceLevel: "Senior",
    remote: true,
    category: "Engineering",
    featured: true,
    postedAt: "2026-10-16",
    description:
      "Build sharp, high-contrast product surfaces for a hiring marketplace used by 40k+ candidates. You will own core listing experiences, application flows, and the public design system.",
    responsibilities: [
      "Ship job discovery, filters, and application interfaces in Next.js.",
      "Pair with design to keep the Brutalist system consistent.",
      "Improve performance of search and listing pages.",
      "Write accessible, testable UI with clear empty and error states.",
    ],
    requirements: [
      "5+ years building production web applications.",
      "Deep React and TypeScript experience.",
      "Comfort with Next.js App Router and server/client boundaries.",
      "A point of view on typography, layout, and interaction.",
    ],
    skills: ["React", "Next.js", "TypeScript", "Tailwind", "Accessibility"],
    benefits: ["Remote-first", "Equipment stipend", "Learning budget", "Private health"],
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Hardline Studio",
    companyTag: "HS",
    location: "Remote",
    salary: "$64k – $88k",
    salaryMin: 64000,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: true,
    category: "Design",
    featured: true,
    postedAt: "2026-10-18",
    description:
      "Design expressive hiring tools that reject generic SaaS aesthetics. You will define layouts, type scales, and interaction rules for both candidates and operators.",
    responsibilities: [
      "Own the candidate journey from search to confirmation.",
      "Produce high-fidelity screens and a living component library.",
      "Run critique with engineering twice weekly.",
      "Prototype dense admin tables that remain readable.",
    ],
    requirements: [
      "3+ years of product design.",
      "Strong typographic and systems thinking.",
      "Portfolio with shipped digital products.",
      "Comfort presenting unfinished work.",
    ],
    skills: ["Figma", "Design systems", "Prototyping", "UX writing"],
    benefits: ["Async culture", "Quarterly offsites", "Unlimited books"],
  },
  {
    id: "3",
    title: "Full-stack Engineer",
    company: "Wazifa Labs",
    companyTag: "WL",
    location: "Alexandria",
    salary: "$58k – $80k",
    salaryMin: 58000,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: false,
    category: "Engineering",
    featured: true,
    postedAt: "2026-10-12",
    description:
      "Work across listings, applications, and admin review tools. You will implement APIs, data models, and the interfaces that sit on top of them.",
    responsibilities: [
      "Model jobs, applications, and review workflows.",
      "Build admin screens for operators reviewing candidates.",
      "Keep forms validated and failure states honest.",
      "Instrument key hiring funnels.",
    ],
    requirements: [
      "Experience with Next.js and Node.",
      "Comfortable with relational data modeling.",
      "Bias toward simple, explicit code.",
    ],
    skills: ["Next.js", "Node", "Postgres", "Zod"],
    benefits: ["Hybrid Cairo/Alex", "Visa support", "Stock options"],
  },
  {
    id: "4",
    title: "Data Analyst",
    company: "Signalboard",
    companyTag: "SB",
    location: "Berlin",
    salary: "$54k – $70k",
    salaryMin: 54000,
    employmentType: "Contract",
    experienceLevel: "Junior",
    remote: true,
    category: "Data",
    featured: false,
    postedAt: "2026-10-10",
    description:
      "Turn application volume, time-to-hire, and funnel drop-off into operator-ready reports.",
    responsibilities: [
      "Build hiring dashboards for weekly ops reviews.",
      "Define metrics for featured vs organic listings.",
      "Partner with product on experiment readouts.",
    ],
    requirements: [
      "SQL fluency.",
      "Experience with visualization tools.",
      "Clear written communication.",
    ],
    skills: ["SQL", "Python", "Looker", "Statistics"],
    benefits: ["Contract-to-hire", "Remote EU hours"],
  },
  {
    id: "5",
    title: "Growth Marketer",
    company: "Punchline",
    companyTag: "PL",
    location: "London",
    salary: "$62k – $84k",
    salaryMin: 62000,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: false,
    category: "Marketing",
    featured: false,
    postedAt: "2026-10-08",
    description:
      "Acquire candidates and hiring teams with campaigns that match the brand: loud, specific, and impossible to ignore.",
    responsibilities: [
      "Own paid and organic acquisition for job seekers.",
      "Write landing copy that sounds like the product.",
      "Work with design on campaign systems.",
    ],
    requirements: [
      "2+ years growth or performance marketing.",
      "Comfortable with measurement and creative testing.",
    ],
    skills: ["SEO", "Paid social", "Copy", "Analytics"],
    benefits: ["London office", "Campaign budget ownership"],
  },
  {
    id: "6",
    title: "Product Manager",
    company: "Northgrid",
    companyTag: "NG",
    location: "Dubai",
    salary: "$90k – $120k",
    salaryMin: 90000,
    employmentType: "Full-time",
    experienceLevel: "Lead",
    remote: true,
    category: "Product",
    featured: true,
    postedAt: "2026-10-19",
    description:
      "Lead the marketplace loop between candidates, employers, and operators. You will sequence the roadmap around discovery quality and review speed.",
    responsibilities: [
      "Set goals for apply conversion and time-to-review.",
      "Write specs that engineers can ship without decoding.",
      "Sit with operators weekly.",
    ],
    requirements: [
      "Shipped marketplace or hiring products.",
      "Strong facilitation and written specs.",
    ],
    skills: ["Roadmapping", "Discovery", "SQL basics", "Facilitation"],
    benefits: ["Leadership track", "Relocation support"],
  },
  {
    id: "7",
    title: "UX Researcher",
    company: "Hardline Studio",
    companyTag: "HS",
    location: "Remote",
    salary: "$50k – $68k",
    salaryMin: 50000,
    employmentType: "Part-time",
    experienceLevel: "Mid",
    remote: true,
    category: "Design",
    featured: false,
    postedAt: "2026-10-05",
    description:
      "Study how candidates search, hesitate, and apply. Feed those findings into listing density and form design.",
    responsibilities: [
      "Run interviews with candidates and hiring managers.",
      "Synthesize findings into decision-ready briefs.",
      "Partner with design on prototype tests.",
    ],
    requirements: [
      "Independent research practice.",
      "Experience recruiting participants.",
    ],
    skills: ["Interviews", "Usability testing", "Synthesis"],
    benefits: ["Flexible hours", "Research stipend"],
  },
  {
    id: "8",
    title: "People Operations Lead",
    company: "Wazifa Labs",
    companyTag: "WL",
    location: "Cairo",
    salary: "$48k – $66k",
    salaryMin: 48000,
    employmentType: "Full-time",
    experienceLevel: "Senior",
    remote: false,
    category: "Operations",
    featured: false,
    postedAt: "2026-10-03",
    description:
      "Design the internal hiring machine: intake, review SLAs, and candidate communication that feels human.",
    responsibilities: [
      "Own application review SLAs.",
      "Train reviewers on the admin workflow.",
      "Keep candidate status communication timely.",
    ],
    requirements: [
      "Operations experience in a high-volume hiring team.",
      "Comfort with tools and process design.",
    ],
    skills: ["Ops", "Hiring", "Process design", "Communication"],
    benefits: ["Cairo HQ", "Family health"],
  },
  {
    id: "9",
    title: "Backend Engineer",
    company: "Signalboard",
    companyTag: "SB",
    location: "Berlin",
    salary: "$76k – $104k",
    salaryMin: 76000,
    employmentType: "Full-time",
    experienceLevel: "Senior",
    remote: true,
    category: "Engineering",
    featured: false,
    postedAt: "2026-10-14",
    description:
      "Scale search, notifications, and application intake. Reliability over ceremony.",
    responsibilities: [
      "Design APIs for listings and applications.",
      "Keep search indexes fresh.",
      "Harden file upload for resumes.",
    ],
    requirements: [
      "Production backend experience at scale.",
      "Careful about auth, validation, and logging.",
    ],
    skills: ["Node", "Postgres", "Redis", "S3"],
    benefits: ["Remote EU", "On-call stipend"],
  },
  {
    id: "10",
    title: "Content Designer",
    company: "Punchline",
    companyTag: "PL",
    location: "London",
    salary: "$46k – $60k",
    salaryMin: 46000,
    employmentType: "Contract",
    experienceLevel: "Junior",
    remote: false,
    category: "Marketing",
    featured: false,
    postedAt: "2026-10-01",
    description:
      "Write the words candidates actually read: labels, empty states, job cards, and confirmation screens.",
    responsibilities: [
      "Audit every form label and status badge.",
      "Write category and campaign copy.",
      "Partner with legal on application disclaimers.",
    ],
    requirements: ["Portfolio of product or content design.", "Editorial instinct."],
    skills: ["UX writing", "Editing", "Tone of voice"],
    benefits: ["3-month contract", "Studio desk"],
  },
];

export const applications = [
  {
    id: "a1",
    jobId: "1",
    candidateName: "Mona El-Sayed",
    email: "mona@example.com",
    phone: "+20 100 111 2233",
    submittedAt: "2026-10-17",
    status: "Under Review",
    coverLetter:
      "I have spent six years shipping product UIs with a strong type-and-layout bias. Wazifa’s public surfaces are exactly the kind of work I want to own.",
  },
  {
    id: "a2",
    jobId: "2",
    candidateName: "Jonas Weber",
    email: "jonas@example.com",
    phone: "+49 171 555 0199",
    submittedAt: "2026-10-18",
    status: "Pending",
    coverLetter:
      "My last three products used high-contrast systems. I would like to tighten the candidate journey without softening the brand.",
  },
  {
    id: "a3",
    jobId: "6",
    candidateName: "Lina Haddad",
    email: "lina@example.com",
    phone: "+971 50 222 4411",
    submittedAt: "2026-10-19",
    status: "Accepted",
    coverLetter:
      "I led marketplace loops at two startups and know how to keep operators and candidates in the same conversation.",
  },
  {
    id: "a4",
    jobId: "4",
    candidateName: "Omar Farouk",
    email: "omar@example.com",
    phone: "+20 122 888 3344",
    submittedAt: "2026-10-11",
    status: "Rejected",
    coverLetter: "I can turn hiring funnels into weekly operator notes without burying the signal.",
  },
  {
    id: "a5",
    jobId: "3",
    candidateName: "Sara Nabil",
    email: "sara@example.com",
    phone: "+20 111 909 1212",
    submittedAt: "2026-10-15",
    status: "Under Review",
    coverLetter:
      "I build full-stack features with explicit validation and boring, reliable data models.",
  },
  {
    id: "a6",
    jobId: "9",
    candidateName: "Erik Holm",
    email: "erik@example.com",
    phone: "+46 70 123 7788",
    submittedAt: "2026-10-16",
    status: "Pending",
    coverLetter: "I care about search freshness, resume storage, and failure modes that operators can trust.",
  },
];

