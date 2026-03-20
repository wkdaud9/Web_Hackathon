import type {
  Hackathon,
  HackathonDetail,
  Leaderboard,
  Submission,
  Team,
  TeamInvite,
} from '../types/models';

/**
 * Generic read wrapper for localStorage with JSON parsing and fallback support.
 * @template T - The type of data being retrieved
 * @param key - The localStorage key
 * @param fallback - The fallback value if key doesn't exist or parsing fails
 * @returns Parsed data or fallback value
 */
export function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generic write wrapper for localStorage with JSON serialization.
 * @template T - The type of data being stored
 * @param key - The localStorage key
 * @param value - The value to store
 */
export function writeToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================================================
// Hackathon Data Access
// ============================================================================

/**
 * Retrieves all hackathons from storage.
 * @returns Array of hackathons, or empty array if none exist
 */
export function getHackathons(): Hackathon[] {
  return readFromStorage<Hackathon[]>('hackathons', []);
}

/**
 * Retrieves detailed information for a specific hackathon by slug.
 * @param slug - The hackathon slug
 * @returns HackathonDetail or null if not found
 */
export function getHackathonDetail(slug: string): HackathonDetail | null {
  const parsed = readFromStorage<HackathonDetail[]>('hackathon_details', []);
  return parsed.find((h) => h.slug === slug) || null;
}

// ============================================================================
// Team Data Access
// ============================================================================

/**
 * Retrieves teams from storage, optionally filtered by hackathon slug.
 * @param hackathonSlug - Optional: filter teams by hackathon slug
 * @returns Array of teams
 */
export function getTeams(hackathonSlug?: string): Team[] {
  const parsed = readFromStorage<Team[]>('teams', []);
  if (hackathonSlug) {
    return parsed.filter((t) => t.hackathonSlug === hackathonSlug);
  }
  return parsed;
}

/**
 * Adds a new team to storage.
 * @param team - The team to add
 */
export function addTeam(team: Team): void {
  const parsed = readFromStorage<Team[]>('teams', []);
  parsed.push(team);
  writeToStorage('teams', parsed);
}

// ============================================================================
// Leaderboard Data Access
// ============================================================================

/**
 * Retrieves leaderboard for a specific hackathon.
 * @param hackathonSlug - The hackathon slug
 * @returns Leaderboard or null if not found
 */
export function getLeaderboard(hackathonSlug: string): Leaderboard | null {
  const parsed = readFromStorage<Leaderboard[]>('leaderboards', []);
  return parsed.find((l) => l.hackathonSlug === hackathonSlug) || null;
}

/**
 * Retrieves all leaderboards from storage.
 * @returns Array of leaderboards
 */
export function getAllLeaderboards(): Leaderboard[] {
  return readFromStorage<Leaderboard[]>('leaderboards', []);
}

// ============================================================================
// Submission Data Access
// ============================================================================

/**
 * Retrieves all submissions from storage.
 * @returns Array of submissions
 */
export function getSubmissions(): Submission[] {
  return readFromStorage<Submission[]>('submissions', []);
}

/**
 * Adds a new submission to storage.
 * @param submission - The submission to add
 */
export function addSubmission(submission: Submission): void {
  const parsed = readFromStorage<Submission[]>('submissions', []);
  parsed.push(submission);
  writeToStorage('submissions', parsed);
}

// ============================================================================
// Team Invite Data Access
// ============================================================================

/**
 * Retrieves team invites from storage, optionally filtered by hackathon slug.
 * @param hackathonSlug - Optional: filter invites by hackathon slug
 * @returns Array of team invites
 */
export function getInvites(hackathonSlug?: string): TeamInvite[] {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  if (hackathonSlug) {
    return parsed.filter((invite) => invite.hackathonSlug === hackathonSlug);
  }
  return parsed;
}

/**
 * Adds a new team invite to storage.
 * @param invite - The invite to add
 */
export function addInvite(invite: TeamInvite): void {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  parsed.push(invite);
  writeToStorage('team_invites', parsed);
}

/**
 * Updates the status of a team invite.
 * @param id - The invite ID
 * @param status - The new status
 * @returns Updated array of team invites
 */
export function updateInviteStatus(
  id: number,
  status: TeamInvite['status']
): TeamInvite[] {
  const parsed = readFromStorage<TeamInvite[]>('team_invites', []);
  const updated = parsed.map((invite) =>
    invite.id === id ? { ...invite, status } : invite
  );
  writeToStorage('team_invites', updated);
  return updated;
}
