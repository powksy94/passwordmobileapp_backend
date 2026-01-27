import express from "express";
import { errorMiddleware } from "./src/middleware/error.middleware";
import authRoutes from "./src/routes/authRoutes";
import vaultRoutes from "./src/routes/vaultRoutes";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);

// middleware d'erreurs EN DERNIER
app.use(errorMiddleware);

export default app;
