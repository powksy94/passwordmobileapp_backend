import express from "express";
import { errorMiddleware } from "./src/middleware/error.middleware";
import authRoutes from "./src/routes/authRoutes";
import vaultRoutes from "./src/routes/vaultRoutes";
import adminRoutes from "./src/routes/adminRoutes"
import generatorRoutes from "./src/routes/generatorRoutes"
import teamAdminRoutes from "./src/routes/teamAdminRoutes"
import cors from "cors"
import { CORS_ORIGIN } from "./src/config/env";

const app = express();

app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }))

app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);
app.use("/admin", adminRoutes);
app.use("/generator", generatorRoutes);
app.use("/team", teamAdminRoutes);

// middleware d'erreurs EN DERNIER
app.use(errorMiddleware);

export default app;
