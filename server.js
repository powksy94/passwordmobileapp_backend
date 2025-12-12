import "dotenv/config";
import express from "express";
import cors from "cors";

// Routes
import authRoutes from "./routes/authRoutes.js";
import vaultRoutes from "./routes/vaultRoutes.js";
import generatorRoutes from "./routes/generatorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teamAdminRoutes from "./routes/teamAdminRoutes.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Password Mobile App Backend is running 🚀");
});


// Routes
app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);
app.use("/generator", generatorRoutes);
app.use("/admin", adminRoutes);
app.use("/team_admin", teamAdminRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
