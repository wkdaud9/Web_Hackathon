import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Users, Trophy, ArrowRight } from 'lucide-react';

const MotionLink = motion(Link);

export default function HomePage() {
  const cards = [
    {
      title: "Hackathons",
      description: "Explore ongoing and upcoming hackathons to showcase your skills.",
      icon: <Rocket className="w-12 h-12 text-blue-400" />,
      link: "/hackathons",
      color: "from-blue-900/40 to-blue-600/10",
      border: "hover:border-blue-500/50"
    },
    {
      title: "Team Camp",
      description: "Find your dream team or recruit top talents for your project.",
      icon: <Users className="w-12 h-12 text-cta" />,
      link: "/camp",
      color: "from-green-900/40 to-green-600/10",
      border: "hover:border-cta/50"
    },
    {
      title: "Rankings",
      description: "Check the global leaderboard and see who's dominating.",
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
        <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Innovate. Build. <br/> Conquer.
        </h1>
        <p className="text-xl text-gray-400">
          The ultimate platform for developer hackathons and team building.
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
            <div className="flex items-center text-sm font-semibold text-white group-hover:text-cta transition-colors">
              Explore <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
          </MotionLink>
        ))}
      </div>
    </div>
  );
}
