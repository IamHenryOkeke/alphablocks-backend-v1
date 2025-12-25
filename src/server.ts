import app from "./app";
import { redis } from "./lib/redis";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await redis.connect();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

startServer();
