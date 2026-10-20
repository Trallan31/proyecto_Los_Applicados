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

router.use(withUser);
router.use("/users", usersRouter);

router.use(
  "/activities",
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
  "/courses",
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
  "/projects",
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
  "/sessions",
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
  "/sprints",
  createCrudRouter(
    Sprint,
    ["projectId", "name"],
    "sprints"
  )
);

router.use(
  "/tasks",
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