import hackathonsData from '../data/public_hackathons.json';
import detailData from '../data/public_hackathon_detail.json';
import teamsData from '../data/public_teams.json';
import leaderboardData from '../data/public_leaderboard.json';
import usersData from '../data/public_users.json';

export function setupData() {
  const existingHackathons = localStorage.getItem('hackathons');
  if (!existingHackathons) {
    localStorage.setItem('hackathons', JSON.stringify(hackathonsData));
  } else {
    try {
      let parsed = JSON.parse(existingHackathons);
      let updated = false;
      parsed = parsed.map((h: any) => {
        const dummy = hackathonsData.find((d: any) => d.slug === h.slug);
        if (dummy && dummy.description && !h.description) {
          updated = true;
          return { ...h, description: dummy.description };
        }
        return h;
      });
      // Append any newly added hackathons from dummy data
      hackathonsData.forEach((dummy: any) => {
        if (!parsed.find((p: any) => p.slug === dummy.slug)) {
          parsed.push(dummy);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('hackathons', JSON.stringify(parsed));
      }
    } catch {
      localStorage.setItem('hackathons', JSON.stringify(hackathonsData));
    }
  }
  
  const baseDetails = [
    {
      slug: detailData.slug,
      title: detailData.title,
      sections: detailData.sections,
    },
    ...detailData.extraDetails.map((extra: { slug: string; title: string; sections: unknown }) => ({
      slug: extra.slug,
      title: extra.title,
      sections: extra.sections,
    }))
  ];

  const existingDetailsStr = localStorage.getItem('hackathon_details');
  if (!existingDetailsStr) {
    localStorage.setItem('hackathon_details', JSON.stringify(baseDetails));
  } else {
    try {
      const existingDetails = JSON.parse(existingDetailsStr);
      let updated = false;
      baseDetails.forEach((bd) => {
        if (!existingDetails.find((ed: any) => ed.slug === bd.slug)) {
          existingDetails.push(bd);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('hackathon_details', JSON.stringify(existingDetails));
      }
    } catch {
      localStorage.setItem('hackathon_details', JSON.stringify(baseDetails));
    }
  }

  const existingTeams = localStorage.getItem('teams');
  if (!existingTeams) {
    localStorage.setItem('teams', JSON.stringify(teamsData));
  } else {
    try {
      let parsed = JSON.parse(existingTeams);
      let updated = false;
      parsed = parsed.map((t: any) => {
        const dummy = teamsData.find((d: any) => d.teamCode === t.teamCode);
        if (dummy && !t.leaderName) {
          updated = true;
          return {
            ...t,
            leaderName: dummy.leaderName,
            members: dummy.members,
            history: dummy.history,
          };
        }
        return t;
      });
      if (updated) {
        localStorage.setItem('teams', JSON.stringify(parsed));
      }
    } catch {
      localStorage.setItem('teams', JSON.stringify(teamsData));
    }
  }

  if (!localStorage.getItem('leaderboards')) {
    const leaderboards = [
      {
        hackathonSlug: leaderboardData.hackathonSlug,
        updatedAt: leaderboardData.updatedAt,
        entries: leaderboardData.entries
      },
      ...leaderboardData.extraLeaderboards.map((extra: { hackathonSlug: string; updatedAt: string; entries: unknown[] }) => ({
        hackathonSlug: extra.hackathonSlug,
        updatedAt: extra.updatedAt,
        entries: extra.entries
      }))
    ];
    localStorage.setItem('leaderboards', JSON.stringify(leaderboards));
  }

  if (!localStorage.getItem('submissions')) {
    localStorage.setItem('submissions', JSON.stringify([]));
  }

  if (!localStorage.getItem('team_invites')) {
    localStorage.setItem('team_invites', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(usersData));
  }
}
