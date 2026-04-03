import type { Team } from '../types/models';

export interface AIMatchResult {
    teamCode: string;
    reason: string;
    matchScore: number;
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
            console.warn("No VITE_GEMINI_API_KEY found, returning mock data.");
            throw new Error("Missing API Key");
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

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text);

    } catch (err) {
        console.error('Gemini API Fetch Error:', err);
    }

    // 3. Absolute Fallback: Mock Data if API completely fails
    return teams.slice(0, 3).map((t, idx) => ({
        teamCode: t.teamCode,
        reason: `${t.name} 팀이 원하는 포지션과 잘 맞을 것 같아요!\n(AI 무료 토큰 소진 또는 에러로 인한 기본 추천)`,
        matchScore: 90 - (idx * 10)
    }));
}
