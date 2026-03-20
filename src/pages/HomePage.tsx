import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Users, Trophy, ArrowRight } from 'lucide-react';

const MotionLink = motion(Link);

export default function HomePage() {
  const cards = [
    {
      title: "해커톤 탐색",
      description: "현재 진행 중이거나 오픈 예정인 해커톤을 확인하고 개발 실력을 뽐내보세요.",
      icon: <Rocket className="w-12 h-12 text-blue-400" />,
      link: "/hackathons",
      color: "from-blue-900/40 to-blue-600/10",
      border: "hover:border-blue-500/50"
    },
    {
      title: "팀 모집 라운지",
      description: "함께 아이디어를 실현할 드림팀을 찾거나 우수한 팀원들을 직접 모집해보세요.",
      icon: <Users className="w-12 h-12 text-cta" />,
      link: "/camp",
      color: "from-green-900/40 to-green-600/10",
      border: "hover:border-cta/50"
    },
    {
      title: "명예의 전당",
      description: "글로벌 리더보드를 거쳐 치열한 개발 경연의 최종 승자와 결과물을 확인하세요.",
      icon: <Trophy className="w-12 h-12 text-amber-400" />,
      link: "/rankings",
      color: "from-amber-900/40 to-amber-600/10",
      border: "hover:border-amber-500/50"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl pt-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent break-keep">
          도전하고. 만들고. <br/> 증명하세요.
        </h1>
        <p className="text-xl text-gray-400 break-keep">
          개발자와 기획자를 위한 최고의 해커톤 및 팀 빌딩 종합 플랫폼입니다.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {cards.map((card, i) => (
          <MotionLink
            key={i}
            to={card.link}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`group relative p-8 rounded-3xl bg-gradient-to-br ${card.color} border border-white/5 ${card.border} transition-all duration-300 overflow-hidden text-left flex flex-col h-full`}
          >
            <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               {/* background icon */}
              <div className="scale-[3]">{card.icon}</div>
            </div>
            <div className="mb-6">{card.icon}</div>
            <h2 className="text-2xl font-bold font-heading mb-3">{card.title}</h2>
            <p className="text-gray-400 mb-8 flex-1">{card.description}</p>
            <div className="flex items-center text-sm font-semibold text-white group-hover:text-cta transition-colors mt-auto">
              바로가기 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
          </MotionLink>
        ))}
      </div>
    </div>
  );
}
