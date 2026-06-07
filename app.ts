import express from "express";
import { errorMiddleware } from "./src/shared/middleware/error.middleware";
import authRoutes from "./src/domains/auth/authRoutes";
import vaultRoutes from "./src/domains/vault/vaultRoutes";
import adminRoutes from "./src/domains/admin/admin.routes"
import adminVaultRoutes from "./src/domains/adminVault/adminVault.routes"
import generatorRoutes from "./src/domains/generator/generatorRoutes"
import teamAdminRoutes from "./src/domains/team/teamAdminRoutes"
import adminAuthRoutes from "./src/domains/adminAuth/adminAuthRoutes"
import cors from "cors"
import { CORS_ORIGIN } from "./src/shared/config/env";

const app = express();

app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }))

app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", adminVaultRoutes);
app.use("/generator", generatorRoutes);
app.use("/team",       teamAdminRoutes);
app.use("/admin-auth", adminAuthRoutes);

// middleware d'erreurs EN DERNIER
app.use(errorMiddleware);

export default app;
