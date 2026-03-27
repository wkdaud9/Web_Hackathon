import type {
  Hackathon,
  HackathonDetail,
  Leaderboard,
  LeaderboardEntry,
  Submission,
  Team,
  TeamInvite,
  User,
  Message,
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

export function updateTeam(team: Team) {
  const parsed = readFromStorage<Team[]>('teams', []);
  const updated = parsed.map((t) => (t.teamCode === team.teamCode ? team : t));
  writeToStorage('teams', updated);
  return team;
}

export function getLeaderboard(hackathonSlug: string) {
  const parsed = readFromStorage<Leaderboard[]>('leaderboards', []);
  return parsed.find((l) => l.hackathonSlug === hackathonSlug) || null;
}

export function getAllLeaderboards() {
  return readFromStorage<Leaderboard[]>('leaderboards', []);
}

export function addLeaderboardEntry(hackathonSlug: string, entry: LeaderboardEntry) {
  const parsed = readFromStorage<Leaderboard[]>('leaderboards', []);
  const boardIndex = parsed.findIndex(l => l.hackathonSlug === hackathonSlug);
  
  if (boardIndex >= 0) {
    parsed[boardIndex].entries.push(entry);
    // Sort entries by score descending
    parsed[boardIndex].entries.sort((a, b) => b.score - a.score);
    // Re-assign ranks
    parsed[boardIndex].entries.forEach((e, idx) => { e.rank = idx + 1; });
    parsed[boardIndex].updatedAt = new Date().toISOString();
  } else {
    parsed.push({
      hackathonSlug,
      updatedAt: new Date().toISOString(),
      entries: [{ ...entry, rank: 1 }]
    });
  }
  
  writeToStorage('leaderboards', parsed);
}

export function getSubmissions() {
  return readFromStorage<Submission[]>('submissions', []);
}

export function addSubmission(submission: Submission) {
  const parsed = readFromStorage<Submission[]>('submissions', []);
  parsed.push(submission);
  writeToStorage('submissions', parsed);
}

export function updateSubmission(submission: Submission) {
  const parsed = readFromStorage<Submission[]>('submissions', []);
  const updated = parsed.map((s) => (s.id === submission.id ? submission : s));
  writeToStorage('submissions', updated);
}

export function getSubmissionByTeam(hackathonSlug: string, teamName: string) {
  const parsed = readFromStorage<Submission[]>('submissions', []);
  return parsed.find(
    (s) => s.hackathonSlug === hackathonSlug && s.teamName === teamName
  ) || null;
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

export function deleteSubmission(id: number, hackathonSlug: string, teamName: string) {
  // 1. Remove from submissions
  const subs = readFromStorage<Submission[]>('submissions', []);
  const updatedSubs = subs.filter((s) => s.id !== id);
  writeToStorage('submissions', updatedSubs);

  // 2. Remove from leaderboards
  const boards = readFromStorage<Leaderboard[]>('leaderboards', []);
  const boardIndex = boards.findIndex(b => b.hackathonSlug === hackathonSlug);
  if (boardIndex >= 0) {
    boards[boardIndex].entries = boards[boardIndex].entries.filter(e => e.teamName !== teamName);
    // Re-rank
    boards[boardIndex].entries.sort((a,b) => b.score - a.score);
    boards[boardIndex].entries.forEach((e, idx) => { e.rank = idx + 1; });
    boards[boardIndex].updatedAt = new Date().toISOString();
    writeToStorage('leaderboards', boards);
  }
}

export function updateInviteStatus(id: number, status: TeamInvite['status']) {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  const updated = parsed.map((invite) => (invite.id === id ? { ...invite, status } : invite));
  writeToStorage('team_invites', updated);
  return updated;
}

export function getUsers() {
  return readFromStorage<User[]>('users', []);
}

export function addUser(user: User) {
  const parsed = readFromStorage<User[]>('users', []);
  parsed.push(user);
  writeToStorage('users', parsed);
}

export function getMessages(receiverId: string): Message[] {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  return allMsgs
    .filter((m) => m.receiverId === receiverId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getConversation(userId: string, otherUserId: string): Message[] {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  return allMsgs
    .filter((m) => 
      (m.senderId === userId && m.receiverId === otherUserId) || 
      (m.senderId === otherUserId && m.receiverId === userId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function sendMessage(message: Message) {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  allMsgs.push(message);
  writeToStorage('messages', allMsgs);
}

export function markMessageAsRead(msgId: string) {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  const updated = allMsgs.map((m) => (m.id === msgId ? { ...m, isRead: true } : m));
  writeToStorage('messages', updated);
}

export function markAllAsRead(receiverId: string, senderId: string) {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  const updated = allMsgs.map((m) => 
    (m.receiverId === receiverId && m.senderId === senderId) ? { ...m, isRead: true } : m
  );
  writeToStorage('messages', updated);
}

export function getUnreadCount(receiverId: string): number {
  return getMessages(receiverId).filter((m) => !m.isRead).length;
}
