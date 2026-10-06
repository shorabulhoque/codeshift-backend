import cors from "cors";
import express from "express";
import type { Application, Request, Response } from "express";
import httpStatus from "http-status";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./middleware/global-error-handler";
import notFound from "./middleware/not-found";
import config from "./config";
import router from "./routes";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to the CodeShift Developer Assessment Platform API!",
	});
});

app.use("/api/v1", router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
