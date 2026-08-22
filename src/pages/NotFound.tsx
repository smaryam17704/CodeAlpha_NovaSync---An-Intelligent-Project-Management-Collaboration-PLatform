import { Link } from "react-router";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-[hsl(222,47%,8%)]"
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto relative px-4">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] bg-clip-text text-transparent mb-4">404</h1>
              <p className="text-lg text-gray-400 mb-6">Page Not Found</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)] rounded-lg text-sm font-medium hover:bg-[hsl(192,100%,50%)]/20 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
