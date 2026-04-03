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
  TeamIdea,
  TeamSchedule,
  TeamResource,
} from '../types/models';

function dispatchUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage-update'));
  }
}

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
  dispatchUpdate();
}

export function updateTeam(team: Team) {
  const parsed = readFromStorage<Team[]>('teams', []);
  const updated = parsed.map((t) => (t.teamCode === team.teamCode ? team : t));
  writeToStorage('teams', updated);
  dispatchUpdate();
  return team;
}

export function updateUser(user: User) {
  const parsed = readFromStorage<User[]>('users', []);
  const updated = parsed.map((u) => (u.id === user.id ? user : u));
  writeToStorage('users', updated);
  dispatchUpdate();
}

export function addUser(user: User) {
  const parsed = readFromStorage<User[]>('users', []);
  parsed.push(user);
  writeToStorage('users', parsed);
  dispatchUpdate();
}

export function leaveTeam(teamCode: string, userNickname: string, userId?: string) {
  const allTeams = getTeams();
  const teamIndex = allTeams.findIndex(t => t.teamCode === teamCode);
  if (teamIndex === -1) return;

  const team = allTeams[teamIndex];
  const updatedMembers = team.members?.filter(m => m !== userNickname) || [];
  const updatedMemberIds = userId ? (team.memberIds?.filter(id => id !== userId) || []) : (team.memberIds || []);

  const updatedTeam = {
    ...team,
    members: updatedMembers,
    memberIds: updatedMemberIds,
    memberCount: Math.max(1, updatedMembers.length + (team.leaderName ? 1 : 0))
    // Usually memberCount should be actual count. leaderName + members.length
  };

  // Correction: If memberCount is used, it should be derived or updated.
  updatedTeam.memberCount = updatedMembers.length + (team.leaderName ? 1 : 0);

  updateTeam(updatedTeam);
}

export function joinTeam(teamCode: string, userNickname: string, userId: string) {
  const allTeams = getTeams();
  const teamIndex = allTeams.findIndex(t => t.teamCode === teamCode);
  if (teamIndex === -1) return;

  const team = allTeams[teamIndex];
  const members = team.members || [];
  const memberIds = team.memberIds || [];

  if (members.includes(userNickname)) return;

  const updatedTeam = {
    ...team,
    members: [...members, userNickname],
    memberIds: [...memberIds, userId]
  };
  updatedTeam.memberCount = updatedTeam.members.length + (team.leaderName ? 1 : 0);

  updateTeam(updatedTeam);
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
    parsed[boardIndex].entries.sort((a, b) => b.score - a.score);
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
  dispatchUpdate();
}

export function updateInviteStatus(id: number, status: 'accepted' | 'rejected') {
  const allInvites = getInvites();
  const inviteIndex = allInvites.findIndex((i) => i.id === id);
  if (inviteIndex >= 0) {
    allInvites[inviteIndex].status = status;
    writeToStorage('team_invites', allInvites);
    dispatchUpdate();
  }
}

export function deleteSubmission(id: number, hackathonSlug: string, teamName: string) {
  const subs = readFromStorage<Submission[]>('submissions', []);
  const updatedSubs = subs.filter((s) => s.id !== id);
  writeToStorage('submissions', updatedSubs);

  const boards = readFromStorage<Leaderboard[]>('leaderboards', []);
  const boardIndex = boards.findIndex(b => b.hackathonSlug === hackathonSlug);
  if (boardIndex >= 0) {
    boards[boardIndex].entries = boards[boardIndex].entries.filter(e => e.teamName !== teamName);
    boards[boardIndex].entries.sort((a, b) => b.score - a.score);
    boards[boardIndex].entries.forEach((e, idx) => { e.rank = idx + 1; });
    writeToStorage('leaderboards', boards);
  }
  dispatchUpdate();
}

export function getUsers() {
  const users = readFromStorage<User[]>('users', []);
  const hasAdmin = users.some(u => u.loginId === 'admin');
  if (!hasAdmin) {
    const adminUser: User = {
      id: 'usr_admin',
      loginId: 'admin',
      password: '123',
      nickname: '관리자',
      email: 'admin@linkton.com',
      points: 999999,
      createdAt: new Date().toISOString(),
      isProfilePublic: true,
      role: 'operator',
      managingHackathonSlug: 'monthly-hackathon-24-04'
    };
    users.push(adminUser);
    writeToStorage('users', users);
  }
  return users;
}

export function getMessages(userId: string) {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  return allMsgs
    .filter((m) => m.receiverId === userId || m.senderId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getChatHistory(userId: string, otherUserId: string) {
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
  dispatchUpdate();
}

export function markMessageAsRead(msgId: string) {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  const updated = allMsgs.map((m) => (m.id === msgId ? { ...m, isRead: true } : m));
  writeToStorage('messages', updated);
  dispatchUpdate();
}

export function markAllAsRead(receiverId: string, senderId: string) {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  const updated = allMsgs.map((m) =>
    (m.receiverId === receiverId && m.senderId === senderId) ? { ...m, isRead: true } : m
  );
  writeToStorage('messages', updated);
  dispatchUpdate();
}

export function getUnreadCount(userId: string): number {
  const allMsgs = readFromStorage<Message[]>('messages', []);
  return allMsgs.filter((m) => m.receiverId === userId && !m.isRead).length;
}

export function getTeamIdeas(teamCode: string) {
  const all = readFromStorage<TeamIdea[]>('team_ideas', []);
  return all.filter((i) => i.teamCode === teamCode).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addTeamIdea(idea: TeamIdea) {
  const all = readFromStorage<TeamIdea[]>('team_ideas', []);
  all.push(idea);
  writeToStorage('team_ideas', all);
  dispatchUpdate();
}

export function updateTeamIdea(idea: TeamIdea) {
  const all = readFromStorage<TeamIdea[]>('team_ideas', []);
  const updated = all.map((i) => (i.id === idea.id ? idea : i));
  writeToStorage('team_ideas', updated);
  dispatchUpdate();
}

export function deleteTeamIdea(id: string) {
  const all = readFromStorage<TeamIdea[]>('team_ideas', []);
  const updated = all.filter((i) => i.id !== id);
  writeToStorage('team_ideas', updated);
  dispatchUpdate();
}

export function getTeamSchedules(teamCode: string) {
  const all = readFromStorage<TeamSchedule[]>('team_schedules', []);
  return all.filter((s) => s.teamCode === teamCode).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function addTeamSchedule(schedule: TeamSchedule) {
  const all = readFromStorage<TeamSchedule[]>('team_schedules', []);
  all.push(schedule);
  writeToStorage('team_schedules', all);
  dispatchUpdate();
}

export function updateTeamSchedule(schedule: TeamSchedule) {
  const all = readFromStorage<TeamSchedule[]>('team_schedules', []);
  const updated = all.map((s) => (s.id === schedule.id ? schedule : s));
  writeToStorage('team_schedules', updated);
  dispatchUpdate();
}

export function deleteTeamSchedule(id: string) {
  const all = readFromStorage<TeamSchedule[]>('team_schedules', []);
  const updated = all.filter((s) => s.id !== id);
  writeToStorage('team_schedules', updated);
  dispatchUpdate();
}

export function getTeamResources(teamCode: string) {
  const all = readFromStorage<TeamResource[]>('team_resources', []);
  return all.filter((r) => r.teamCode === teamCode).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addTeamResource(resource: TeamResource) {
  const all = readFromStorage<TeamResource[]>('team_resources', []);
  all.push(resource);
  writeToStorage('team_resources', all);
  dispatchUpdate();
}

export function updateTeamResource(resource: TeamResource) {
  const all = readFromStorage<TeamResource[]>('team_resources', []);
  const updated = all.map((r) => (r.id === resource.id ? resource : r));
  writeToStorage('team_resources', updated);
  dispatchUpdate();
}

export function deleteTeamResource(id: string) {
  const all = readFromStorage<TeamResource[]>('team_resources', []);
  const updated = all.filter((r) => r.id !== id);
  writeToStorage('team_resources', updated);
  dispatchUpdate();
}
