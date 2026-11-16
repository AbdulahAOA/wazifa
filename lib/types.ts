export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type ExperienceLevel = "Junior" | "Mid" | "Senior" | "Lead";
export type ApplicationStatus = "Pending" | "Under Review" | "Accepted" | "Rejected" | "Withdrawn";
export type JobStatus = "draft" | "published" | "closed" | "archived";
export type UserRole = "candidate" | "admin";

export type Job = {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyTag: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number | null;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  remote: boolean;
  category: string;
  categoryId: string;
  featured: boolean;
  status: JobStatus;
  postedAt: string;
  publishedAt: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
};

export type Application = {
  id: string;
  jobId: string;
  candidateUserId: string;
  candidateName: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: ApplicationStatus;
  coverLetter: string;
  details: string;
  notes: string;
  resumeFileId: string | null;
};

export type ApplicationEvent = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string;
  createdAt: string;
  actorName: string | null;
};

export type ProfileExperienceEntry = {
  title: string;
  company: string;
  period: string;
  summary: string;
};

export type ProfileEducationEntry = {
  school: string;
  degree: string;
  year: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  headline: string;
  location: string;
  bio: string;
  avatarFileId: string | null;
  skills: string[];
  experience: ProfileExperienceEntry[];
  education: ProfileEducationEntry[];
  resumeFileId: string | null;
};

export type SavedJobListing = Job & {
  listingState: "open" | "closed" | "unavailable";
};
