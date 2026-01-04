import app from "./app.js";
import { connectMongo } from "./config/mongo.ts";
import { pool } from "./config/postgres.ts";
import { PORT } from "./config/env.ts";

(async () => {
  try {
    await connectMongo();
    await pool.connect();
    console.log("✅ PostgreSQL connected");

    app.listen(PORT || 5000, () => console.log(`Server running on port ${PORT || 5000}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
