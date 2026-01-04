import express from "express";
import authRoutes from "./routes/authRoutes.ts";
import vaultRoutes from "./routes/vaultRoutes.ts";

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);

export default app;
