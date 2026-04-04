import type { Team } from '../types/models';

export interface AIMatchResult {
    teamCode: string;
    reason: string;
    matchScore: number;
}

const SKILL_KEYWORDS: Record<string, string[]> = {
    'Backend': ['백엔드', '서버', 'server', 'node.js', 'spring', 'db', 'python', 'django', 'nestjs', 'api', '인프라'],
    'Frontend': ['프론트', 'front', 'react', 'next.js', 'typescript', 'vue', 'svelte', 'css', '클라이언트'],
    'Designer': ['디자인', 'designer', 'figma', 'ui', 'ux', '그래픽', '일러스트'],
    'PM': ['기획', 'pm', '서비스', '비즈니스', '설계', '협업'],
    'AI/ML': ['인공지능', 'ai', '머신러닝', 'ml', '데이터', 'pytorch', 'tensorflow', 'llm'],
    'Mobile': ['모바일', 'app', 'flutter', 'react native', 'ios', 'android', 'swift', 'kotlin']
};

/**
 * AI API 호출 실패 시를 대비한 룰 기반 매칭 로직
 */
function ruleBasedRecommendation(userSkills: string, teams: Team[]): AIMatchResult[] {
    const userText = userSkills.toLowerCase();
    const openTeams = teams.filter(t => t.isOpen);

    const matches = openTeams.map(team => {
        let score = 0;
        const matchedCategories: string[] = [];
        const teamText = (team.intro + ' ' + team.lookingFor.join(' ')).toLowerCase();

        // 1. 카테고리별 키워드 매칭
        Object.entries(SKILL_KEYWORDS).forEach(([category, keywords]) => {
            const hasUserSkill = keywords.some(k => userText.includes(k.toLowerCase()));
            const needsCategory = keywords.some(k => teamText.includes(k.toLowerCase()));

            if (hasUserSkill && needsCategory) {
                score += 40; // 핵심 역량 일치
                matchedCategories.push(category);
            } else if (hasUserSkill || needsCategory) {
                // 한쪽만 일치해도 약간의 점수 부여 (잠재적 관심사)
                if (keywords.some(k => teamText.includes(k.toLowerCase()) || userText.includes(k.toLowerCase()))) {
                    score += 5;
                }
            }
        });

        // 2. 단순 텍스트 포함도 보정
        const commonWords = userText.split(' ').filter(w => w.length > 1);
        commonWords.forEach(word => {
            if (teamText.includes(word)) score += 10;
        });

        // 점수 정규화 (0~100) 및 사유 생성
        const finalScore = Math.min(Math.max(score, 10), 95); // 룰 기반이므로 100점은 주지 않음
        
        let reason = '';
        if (matchedCategories.length > 0) {
            reason = `사용자가 언급한 "${matchedCategories.join(', ')}" 관련 역량이 팀의 모집 분야와 잘 매치됩니다. 특히 ${team.lookingFor.join(', ')} 포지션에서 시너지를 낼 수 있을 것 같아요!`;
        } else {
            reason = `팀의 소개 내용과 사용자님의 소개를 종합해 볼 때, 함께 프로젝트를 수행하기에 매우 적합한 팀으로 판단됩니다.`;
        }

        return {
            teamCode: team.teamCode,
            reason: reason,
            matchScore: finalScore
        };
    });

    // 점수 높은 순으로 정렬 후 상위 3개 반환
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

export async function getTeamRecommendations(userSkills: string, teams: Team[]): Promise<AIMatchResult[]> {
    const prompt = `
  You are an AI assistant specialized in matching a user to open hackathon teams.
  The user has the following skills or introduction: "${userSkills}".
  Here are the teams currently looking for members:
  ${JSON.stringify(teams.filter(t => t.isOpen).map(t => ({ id: t.teamCode, name: t.name, lookingFor: t.lookingFor, intro: t.intro })))}
  
  Please analyze the team requirements and the user's skills. Return a JSON array of the top 3 best matching teams.
  If there are less than 3 teams, return as many as possible.
  You must format exactly as this JSON array schema, do not include any other markdown:
  [
    {
      "teamCode": "string (the team id)",
      "reason": "string (A polite and persuasive reason in Korean why this team is a good fit for the user)",
      "matchScore": number (0 to 100)
    }
  ]
  `;

    try {
        // 1. Try Vercel Serverless Function first (if deployed on Vercel)
        if (window.location.hostname.includes('vercel.app')) {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return JSON.parse(text);
            }
        }

        // 2. Fallback to local process.env / import.meta.env
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("No VITE_GEMINI_API_KEY found, returning rule-based matching.");
            return ruleBasedRecommendation(userSkills, teams);
        }

        // NOTE: Using gemini-2.0-flash (free tier) for the fastest results
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!res.ok) throw new Error("API Limit Reached or Error");

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text);

    } catch (err) {
        console.error('Gemini API Fetch Error:', err);
    }

    // 3. Absolute Fallback: Rule-based recommendation
    return ruleBasedRecommendation(userSkills, teams);
}
