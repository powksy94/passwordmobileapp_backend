import express from "express";
import { authMiddleware} from "./src/middleware/auth.middleware";
import { errorMiddleware } from "./src/middleware/error.middleware";

const app = express();
app.use(express.json());



app.use("/auth", authRoutes);
app.use("/vault", vaultRoutes);

export default app;
