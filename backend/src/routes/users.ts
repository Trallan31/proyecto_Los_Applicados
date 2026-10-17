import { Router } from "express";
import User from "../models/user";

const router = Router();

router.get("/", async (_request, response, next) => {
  try {
    const users = await User.find({}).select(
      "_id username name lastName mail initials avatarColor"
    );

    response.json(users);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
