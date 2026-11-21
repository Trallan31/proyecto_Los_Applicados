import { Router } from "express";
import Activity from "../models/activity";
import Course from "../models/course";
import Project from "../models/project";
import Session from "../models/session";
import Sprint from "../models/sprint";
import Task from "../models/task";
import { createCrudRouter } from "./crud";
import usersRouter from "./users";
import { withUser } from "../middleware/auth";

const router = Router();

router.use("/users", withUser, usersRouter);

router.use(
  "/activities", withUser,
  createCrudRouter(
    Activity,
    [
      "projectId",
      "sprintId",
      "title",
      "description",
      "category",
      "members",
      "priority",
      "status",
      "hours",
      "dueDate",
    ],
    "activities"
  )
);

router.use(
  "/courses", withUser,
  createCrudRouter(
    Course,
    [
      "userId",
      "name",
      "code",
      "shortName",
      "color",
      "links",
    ],
    "courses"
  )
);

router.use(
  "/projects", withUser,
  createCrudRouter(
    Project,
    [
      "name",
      "description",
      "color",
      "course",
      "categories",
      "members",
      "links",
    ],
    "projects"
  )
);

router.use(
  "/sessions", withUser,
  createCrudRouter(
    Session,
    [
      "courseId",
      "dayOfWeek",
      "startHour",
      "duration",
      "type",
    ],
    "sessions"
  )
);

router.use(
  "/sprints", withUser,
  createCrudRouter(
    Sprint,
    ["projectId", "name"],
    "sprints"
  )
);

router.use(
  "/tasks", withUser,
  createCrudRouter(
    Task,
    [
      "userId",
      "title",
      "scope",
      "courseId",
      "type",
      "endDate",
      "dueTime",
      "status",
      "priority",
      "notes",
    ],
    "tasks"
  )
);

export default router;