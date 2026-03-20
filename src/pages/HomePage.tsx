import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Users, Trophy, ChevronRight } from 'lucide-react';

const MotionLink = motion(Link);

export default function HomePage() {
  const cards = [
    {
      title: "해커톤 보러가기",
      description: "현재 진행 중이거나 오픈 예정인 해커톤을 확인하고 개발 실력을 뽐내보세요.",
      icon: <Rocket className="w-10 h-10 text-cta" />,
      link: "/hackathons",
      bgColor: "bg-white",
      hoverRing: "hover:ring-1 hover:ring-cta/30"
    },
    {
      title: "팀 찾기",
      description: "함께 아이디어를 실현할 드림팀을 찾거나 우수한 팀원들을 직접 모집해보세요.",
      icon: <Users className="w-10 h-10 text-emerald-500" />,
      link: "/camp",
      bgColor: "bg-white",
      hoverRing: "hover:ring-1 hover:ring-emerald-500/30"
    },
    {
      title: "랭킹 보기",
      description: "글로벌 리더보드를 거쳐 치열한 개발 경연의 최종 승자와 결과물을 확인하세요.",
      icon: <Trophy className="w-10 h-10 text-amber-500" />,
      link: "/rankings",
      bgColor: "bg-white",
      hoverRing: "hover:ring-1 hover:ring-amber-500/30"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] gap-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl pt-8"
      >
        <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 tracking-tight text-primary break-keep leading-tight">
          문서만 남은 프로젝트,
          <br />
          서비스로 완성하세요
        </h1>
        <p className="text-lg md:text-xl text-secondary break-keep leading-relaxed font-medium">
          해커톤 탐색부터 팀 빌딩, 제출 관리와 리더보드까지.
          <br />
          심사 기준을 통과할 수 있도록 핵심 흐름을 빠르게 점검하세요.
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
            whileHover={{ y: -6, scale: 1.02 }}
            className={`group relative p-8 rounded-[28px] ${card.bgColor} ${card.hoverRing} transition-all duration-300 overflow-hidden text-left flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}
          >
            <div className="mb-6 bg-gray-50/50 inline-flex p-4 rounded-2xl">{card.icon}</div>
            <h2 className="text-2xl font-bold font-heading mb-3 text-primary">{card.title}</h2>
            <p className="text-secondary font-medium leading-relaxed mb-8 flex-1">{card.description}</p>
            <div className="flex items-center text-sm font-bold text-tertiary group-hover:text-primary transition-colors mt-auto">
              바로가기 <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </MotionLink>
        ))}
      </div>
    </div>
  );
}
