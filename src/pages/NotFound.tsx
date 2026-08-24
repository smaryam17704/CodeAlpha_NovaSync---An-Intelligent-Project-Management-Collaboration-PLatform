import { Link } from "react-router";
import { motion } from "framer-motion";
import NovaSyncLogo from "../components/NovaSyncLogo";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#faf9f7' }}
    >
      <div className="text-center">
        <NovaSyncLogo size={48} className="mx-auto mb-6" />
        <h1 className="text-7xl font-extrabold mb-4" style={{ color: '#e8eaef' }}>404</h1>
        <p className="text-lg font-medium mb-6" style={{ color: '#5e6278' }}>Page Not Found</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md"
          style={{ background: '#0d9488' }}
        >
          Go Home
        </Link>
      </div>
    </motion.div>
  );
}
