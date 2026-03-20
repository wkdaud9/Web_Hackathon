import type {
  Hackathon,
  HackathonDetail,
  Leaderboard,
  Submission,
  Team,
  TeamInvite,
} from '../types/models';

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getHackathons() {
  return readFromStorage<Hackathon[]>('hackathons', []);
}

export function getHackathonDetail(slug: string) {
  const parsed = readFromStorage<HackathonDetail[]>('hackathon_details', []);
  return parsed.find((h) => h.slug === slug) || null;
}

export function getTeams(hackathonSlug?: string) {
  const parsed = readFromStorage<Team[]>('teams', []);
  if (hackathonSlug) {
    return parsed.filter((t) => t.hackathonSlug === hackathonSlug);
  }
  return parsed;
}

export function addTeam(team: Team) {
  const parsed = readFromStorage<Team[]>('teams', []);
  parsed.push(team);
  writeToStorage('teams', parsed);
}

export function getLeaderboard(hackathonSlug: string) {
  const parsed = readFromStorage<Leaderboard[]>('leaderboards', []);
  return parsed.find((l) => l.hackathonSlug === hackathonSlug) || null;
}

export function getAllLeaderboards() {
  return readFromStorage<Leaderboard[]>('leaderboards', []);
}

export function getSubmissions() {
  return readFromStorage<Submission[]>('submissions', []);
}

export function addSubmission(submission: Submission) {
  const parsed = readFromStorage<Submission[]>('submissions', []);
  parsed.push(submission);
  writeToStorage('submissions', parsed);
}

export function getInvites(hackathonSlug?: string) {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  if (hackathonSlug) {
    return parsed.filter((invite) => invite.hackathonSlug === hackathonSlug);
  }
  return parsed;
}

export function addInvite(invite: TeamInvite) {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  parsed.push(invite);
  writeToStorage('team_invites', parsed);
}

export function updateInviteStatus(id: number, status: TeamInvite['status']) {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  const updated = parsed.map((invite) => (invite.id === id ? { ...invite, status } : invite));
  writeToStorage('team_invites', updated);
  return updated;
}
