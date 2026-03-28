export type HackathonStatus = 'ongoing' | 'upcoming' | 'ended';

export interface Hackathon {
  slug: string;
  title: string;
  status: HackathonStatus;
  tags: string[];
  thumbnailUrl?: string;
  period: {
    timezone?: string;
    submissionDeadlineAt?: string;
    endAt?: string;
  };
  links?: {
    detail?: string;
    rules?: string;
    faq?: string;
  };
}

export interface Team {
  teamCode: string;
  hackathonSlug?: string;
  name: string;
  isOpen: boolean;
  memberCount: number;
  lookingFor: string[];
  intro: string;
  contact?: {
    type?: string;
    url?: string;
  };
  createdAt: string;
  leaderName?: string;
  members?: string[];
  memberIds?: string[];
  history?: Array<{
    eventName: string;
    prize: string;
  }>;
}

export interface Submission {
  id: number;
  hackathonSlug?: string;
  teamName?: string;
  notes: string;
  fileUrl: string;
  fileName?: string;
  submittedAt: string;
}

export type TeamInviteStatus = 'pending' | 'accepted' | 'rejected';

export interface TeamInvite {
  id: number;
  hackathonSlug: string;
  teamCode: string;
  applicantName: string;
  applicantId: string;
  message?: string;
  status: TeamInviteStatus;
  type: 'application' | 'invitation';
  createdAt: string;
}

export interface User {
  id: string;
  loginId?: string;
  password?: string;
  nickname: string;
  email?: string | null;
  points: number;
  profileImage?: string;
  createdAt: string;
  // Options for privacy handling:
  isProfilePublic: boolean;
}

export interface TeamChat {
  id: number;
  teamCode: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
  submittedAt: string;
}

export interface Leaderboard {
  hackathonSlug: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
}

export interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface HackathonDetail {
  slug: string;
  title: string;
  sections: {
    overview?: {
      summary?: string;
    };
    info?: {
      notice?: string[];
    };
    eval?: {
      description?: string;
      scoreDisplay?: {
        label: string;
        breakdown?: Array<{ label: string; weightPercent: number }>;
      };
    };
    schedule?: {
      milestones?: Array<{ name: string; at: string }>;
    };
    prize?: {
      items?: Array<{ place: string; amountKRW: number }>;
    };
    submit?: {
      guide?: string[];
    };
    leaderboard?: {
      note?: string;
    };
  };
}
export interface TeamSchedule {
  id: string;
  teamCode: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface TeamResource {
  id: string;
  teamCode: string;
  title: string;
  description?: string;
  url: string;
  type: 'file' | 'link' | 'github' | 'design';
  sharedBy: string;
  createdAt: string;
}

export interface TeamIdea {
  id: string;
  teamCode: string;
  author: string;
  content: string;
  createdAt: string;
}
