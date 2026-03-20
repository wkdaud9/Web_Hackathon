export function getHackathons() {
  const data = localStorage.getItem('hackathons');
  return data ? JSON.parse(data) : [];
}

export function getHackathonDetail(slug: string) {
  const data = localStorage.getItem('hackathon_details');
  if (!data) return null;
  const parsed = JSON.parse(data);
  return parsed.find((h: any) => h.slug === slug) || null;
}

export function getTeams(hackathonSlug?: string) {
  const data = localStorage.getItem('teams');
  if (!data) return [];
  const parsed = JSON.parse(data);
  if (hackathonSlug) {
    return parsed.filter((t: any) => t.hackathonSlug === hackathonSlug);
  }
  return parsed;
}

export function addTeam(team: any) {
  const data = localStorage.getItem('teams');
  const parsed = data ? JSON.parse(data) : [];
  parsed.push(team);
  localStorage.setItem('teams', JSON.stringify(parsed));
}

export function getLeaderboard(hackathonSlug: string) {
  const data = localStorage.getItem('leaderboards');
  if (!data) return null;
  const parsed = JSON.parse(data);
  return parsed.find((l: any) => l.hackathonSlug === hackathonSlug) || null;
}

export function getAllLeaderboards() {
  const data = localStorage.getItem('leaderboards');
  return data ? JSON.parse(data) : [];
}

export function getSubmissions() {
  const data = localStorage.getItem('submissions');
  return data ? JSON.parse(data) : [];
}

export function addSubmission(submission: any) {
  const data = localStorage.getItem('submissions');
  const parsed = data ? JSON.parse(data) : [];
  parsed.push(submission);
  localStorage.setItem('submissions', JSON.stringify(parsed));
}
