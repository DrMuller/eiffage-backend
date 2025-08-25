import dotenv from "dotenv";
// Load environment variables before other imports
dotenv.config();

import express, { Express } from "express";
import { authRoutes, userRoutes, userAdminRoutes } from "./auth";
import { skillsRoutes } from "./skills";
import { evaluationRoutes } from "./evaluation";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { connect } from "./utils/mongo/dbHelper";

const app: Express = express();
const PORT = process.env.PORT || 3000;

connect();
const corsOptions = {
    origin: true, // Allow any origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin routes
app.use("/admin/users", userAdminRoutes);

// Auth routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Skills routes
app.use("/api", skillsRoutes);

// Evaluation routes
app.use("/api", evaluationRoutes);

// Error handler middleware
app.use(errorHandler);
app.listen(PORT, () => { logger.info(`Server running on port ${PORT}`) });

export default app;
