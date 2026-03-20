import hackathonsData from '../data/public_hackathons.json';
import detailData from '../data/public_hackathon_detail.json';
import teamsData from '../data/public_teams.json';
import leaderboardData from '../data/public_leaderboard.json';

export function setupData() {
  if (!localStorage.getItem('hackathons')) {
    localStorage.setItem('hackathons', JSON.stringify(hackathonsData));
  }
  
  if (!localStorage.getItem('hackathon_details')) {
    const details = [
      {
        slug: detailData.slug,
        title: detailData.title,
        sections: detailData.sections,
      },
      ...detailData.extraDetails.map((extra: any) => ({
        slug: extra.slug,
        title: extra.title,
        sections: extra.sections,
      }))
    ];
    localStorage.setItem('hackathon_details', JSON.stringify(details));
  }

  if (!localStorage.getItem('teams')) {
    localStorage.setItem('teams', JSON.stringify(teamsData));
  }

  if (!localStorage.getItem('leaderboards')) {
    const leaderboards = [
      {
        hackathonSlug: leaderboardData.hackathonSlug,
        updatedAt: leaderboardData.updatedAt,
        entries: leaderboardData.entries
      },
      ...leaderboardData.extraLeaderboards.map((extra: any) => ({
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
}
