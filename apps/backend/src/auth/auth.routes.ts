import { Router } from "express";

import {
  loginController,
  logoutController,
  meController,
  registerController
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", requireAuth, logoutController);
