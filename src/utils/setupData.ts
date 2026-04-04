import type { Submission } from '../types/models';
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
        if (dummy) {
          let hUpdated = false;
          if (dummy.description && !h.description) {
            h.description = dummy.description;
            hUpdated = true;
          }
          if (dummy.status !== h.status) {
            h.status = dummy.status;
            hUpdated = true;
          }
          if (JSON.stringify(dummy.period) !== JSON.stringify(h.period)) {
            h.period = dummy.period;
            hUpdated = true;
          }
          if (hUpdated) updated = true;
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
      
      // Update existing details if sections have changed
      const synchronizedDetails = existingDetails.map((ed: any) => {
        const dummy = baseDetails.find(bd => bd.slug === ed.slug);
        if (dummy && JSON.stringify(dummy.sections) !== JSON.stringify(ed.sections)) {
          updated = true;
          return { ...ed, sections: dummy.sections };
        }
        return ed;
      });

      // Add new details if they don't exist
      baseDetails.forEach((bd) => {
        if (!synchronizedDetails.find((ed: any) => ed.slug === bd.slug)) {
          synchronizedDetails.push(bd);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('hackathon_details', JSON.stringify(synchronizedDetails));
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

  const existingSubmissions = localStorage.getItem('submissions');
  if (!existingSubmissions || JSON.parse(existingSubmissions).length === 0) {
    const dummySubmissions: Submission[] = [
      {
        id: 1,
        hackathonSlug: 'daker-handover-2026-03',
        teamName: '404found',
        notes: 'AI 기반 협업 툴의 혁신적인 프로토타입입니다. React와 Node.js를 활용하여 실시간 동기화 기능을 구현했습니다.',
        fileUrl: 'https://example.com/404found-solution.pdf',
        githubUrl: 'https://github.com/404found/link-ton',
        fileName: '404found_기획서.pdf',
        submittedAt: '2026-04-13T09:58:00+09:00'
      },
      {
        id: 2,
        hackathonSlug: 'daker-handover-2026-03',
        teamName: 'LGTM',
        notes: '웹 접근성을 고려한 해커톤 운영 플랫폼입니다. Next.js와 TailwindCSS를 사용하여 프리미엄한 사용자 경험을 제공합니다.',
        fileUrl: 'https://example.com/lgtm-solution.pdf',
        githubUrl: 'https://github.com/lgtm-team/hack-platform',
        fileName: 'LGTM_기획서_최종.pdf',
        submittedAt: '2026-04-13T09:40:00+09:00'
      },
      {
        id: 3,
        hackathonSlug: 'aimers-8-model-lite',
        teamName: 'Team Alpha',
        notes: '초경량화 AI 모델을 활용한 모바일 에지 컴퓨팅 솔루션입니다. 기존 모델 대비 40% 이상의 효율 향상을 달성했습니다.',
        fileUrl: 'https://example.com/alpha-solution.pdf',
        githubUrl: 'https://github.com/team-alpha/ai-lite',
        fileName: 'Alpha_Model_Lite_Plan.pdf',
        submittedAt: '2026-02-24T21:05:00+09:00'
      },
      {
        id: 4,
        hackathonSlug: 'aimers-8-model-lite',
        teamName: 'Team Gamma',
        notes: '강화 학습 기반의 스마트 팩토리 최적화 알고리즘입니다. 실시간 데이터 스트리밍 처리를 위해 최적화된 아키텍처를 적용했습니다.',
        fileUrl: 'https://example.com/gamma-solution.pdf',
        githubUrl: 'https://github.com/gamma-research/smart-factory',
        fileName: 'Gamma_Smart_Factory_Solution.pdf',
        submittedAt: '2026-02-25T09:40:00+09:00'
      }
    ];
    localStorage.setItem('submissions', JSON.stringify(dummySubmissions));
  }

  if (!localStorage.getItem('team_invites')) {
    localStorage.setItem('team_invites', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(usersData));
  }
}
