import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Rocket, Users, Trophy, ChevronRight, MousePointer2 } from 'lucide-react';
import { useRef } from 'react';

const MotionLink = motion(Link);

function GalleryCard({ card, index }: { card: any, index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.05 });

  return (
    <MotionLink
      ref={ref}
      to={card.link}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 30 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -12,
        transition: { duration: 0.3 }
      }}
      className="group relative h-[480px] rounded-[42px] overflow-hidden shadow-2xl bg-neutral-900 flex flex-col"
    >
      {/* Background Image Container with Reveal Effect */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          src={card.image} 
          alt={card.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        {/* Dark Opaque Overlay (Fades on Hover) */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-neutral-950 opacity-90 group-hover:opacity-40 transition-opacity duration-500 ease-out z-10" />
        
        {/* Accent Color Glow on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-t ${card.overlay} opacity-0 group-hover:opacity-40 transition-opacity duration-500 z-11`} />
      </div>

      {/* Content Area - Sharp & Professional */}
      <div className="relative mt-auto p-10 z-20 transition-all duration-500 group-hover:-translate-y-4">
        <div className={`mb-6 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all duration-300 group-hover:bg-white group-hover:text-primary group-hover:rotate-[8deg] group-hover:scale-110 shadow-lg`}>
          {card.icon}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-black font-heading text-white tracking-tighter leading-none mb-2">
            {card.subtitle}
          </h2>
          <p className="text-white/60 font-bold text-[16px] leading-relaxed max-w-xs group-hover:text-white transition-colors duration-500">
            {card.description}
          </p>
        </div>

        <div className="mt-10 flex items-center text-[13px] font-black text-white tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
           {card.action} <ChevronRight className="w-5 h-5 ml-1" />
        </div>
      </div>
    </MotionLink>
  );
}

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  const cards = [
    {
      title: "HACKATHONS",
      subtitle: "해커톤 탐색",
      description: "당신의 기술을 증명할 무대를 찾으세요.\n글로벌 해커톤의 문이 열립니다.",
      icon: <Rocket className="w-7 h-7" />,
      link: "/hackathons",
      action: "지금 탐색하기",
      image: "/assets/images/hackathon_explorer.png",
      overlay: "from-blue-950 via-blue-900/10 to-transparent"
    },
    {
      title: "TEAM CAMP",
      subtitle: "팀 빌딩",
      description: "완벽한 팀원와 함께라면 불가능은 없습니다.\n팀원을 모집하고 혁신을 시작하세요.",
      icon: <Users className="w-7 h-7" />,
      link: "/camp",
      action: "팀 구하러 가기",
      image: "/assets/images/team_building.png",
      overlay: "from-emerald-950 via-emerald-900/10 to-transparent"
    },
    {
      title: "RANKINGS",
      subtitle: "명예의 전당",
      description: "노력의 가치를 숫자로 증명하세요.",
      icon: <Trophy className="w-7 h-7" />,
      link: "/rankings",
      action: "랭킹 확인하기",
      image: "/assets/images/rankings_tropy.png",
      overlay: "from-orange-950 via-orange-900/10 to-transparent"
    }
  ];

  return (
    <div ref={containerRef} className="w-full relative bg-white overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-50/40 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-50/40 rounded-full blur-[120px] -z-10" />

      {/* SECTION 1: HERO */}
      <motion.section 
        style={{ opacity: heroOpacity, y: heroY }}
        className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center relative px-6 mt-[-30px]"
      >
        <div className="max-w-4xl text-center relative z-10 w-full pt-10">
          <h1 className="text-6xl md:text-9xl font-black font-heading tracking-tighter text-primary break-keep leading-[1.1] text-shadow-xl mb-12">
             해커톤 통합 관리의
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4F46E5] via-[#9333EA] via-[#EC4899] via-[#FB923C] to-[#4F46E5] animate-gradient pb-8 block drop-shadow-[0_0_25px_rgba(147,51,234,0.3)]">
               넥스트 레벨
            </span>
          </h1>
          
          <div className="space-y-2">
            <p className="text-xl md:text-2xl text-secondary break-keep leading-relaxed font-bold opacity-70">
              기획부터 팀 매칭, 결과 제출과 심사 관리까지. 
            </p>
            <p className="text-xl md:text-2xl text-secondary break-keep leading-relaxed font-bold opacity-70">
              모든 프로세스를 <span className="text-primary">단일 플랫폼</span>에서 제어하세요.
            </p>
          </div>
        </div>

        {/* Vertical Scroll Guide */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="hidden xl:flex absolute right-16 top-1/2 -translate-y-1/2 flex-col items-center gap-6"
        >
          <div className="flex flex-col items-center gap-3">
             <span className="[writing-mode:vertical-lr] text-[12px] font-black tracking-[0.4em] uppercase text-cta/40">
                SCROLL DOWN
             </span>
             <motion.div 
               animate={{ y: [0, 8, 0] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
             >
                <MousePointer2 className="w-4 h-4 text-cta/60" />
             </motion.div>
          </div>
          <div className="w-px h-24 bg-gradient-to-b from-cta/40 to-transparent" />
        </motion.div>
      </motion.section>

      {/* SECTION 2: GALLERY CARDS */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-0 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {cards.map((card, i) => (
            <GalleryCard key={i} card={card} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
