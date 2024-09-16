"use client";

import { motion } from "framer-motion";

export const CameraView = () => {
  return (
    <div className="md:max-w-[452px] max-w-[calc(100dvw-80px)] w-full pb-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <motion.div
            className="h-58 w-72 dark:bg-zinc-800 bg-zinc-100 rounded-lg p-2 flex flex-col justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              objectFit: "cover",
              borderRadius: "0.5rem",
              background: `url('/yard.jpg') no-repeat center center / cover`,
            }}
          >
            <div className="text-xs px-1 py-0.5 bg-white text-zinc-900 w-fit rounded-md">
              Front Yard
            </div>
          </motion.div>

          <div className="flex flex-col gap-2">
            <motion.div
              className="h-28 w-52 dark:bg-zinc-800 bg-zinc-100 rounded-lg flex flex-col justify-end p-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                objectFit: "cover",
                borderRadius: "0.5rem",
                background: `url('/patio.jpg') no-repeat center center / cover`,
              }}
            >
              <div className="text-xs px-1 py-0.5 bg-white text-zinc-900 w-fit rounded-md">
                Patio
              </div>
            </motion.div>
            <motion.div
              className="h-28 w-52 dark:bg-zinc-800 bg-zinc-100 rounded-lg flex flex-col justify-end p-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                objectFit: "cover",
                borderRadius: "0.5rem",
                background: `url('/side.jpg') no-repeat center center / cover`,
              }}
            >
              <div className="text-xs px-1 py-0.5 bg-white text-zinc-900 w-fit rounded-md">
                Side
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
