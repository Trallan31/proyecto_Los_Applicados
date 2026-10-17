import { Router } from "express";
import Activity from "../models/activity";
import Course from "../models/course";
import Project from "../models/project";
import Session from "../models/session";
import Sprint from "../models/sprint";
import Task from "../models/task";
import { createCrudRouter } from "./crud";
import usersRouter from "./users";

const router = Router();
router.use("/users", usersRouter);

router.use(
  "/activities",
  createCrudRouter(Activity, [
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
  ])
);

router.use(
  "/courses",
  createCrudRouter(Course, [
    "userId",
    "name",
    "code",
    "shortName",
    "color",
    "links",
  ])
);

router.use(
  "/projects",
  createCrudRouter(Project, [
    "name",
    "description",
    "color",
    "course",
    "categories",
    "members",
    "links",
  ])
);

router.use(
  "/sessions",
  createCrudRouter(Session, [
    "courseId",
    "dayOfWeek",
    "startHour",
    "duration",
    "type",
  ])
);

router.use(
  "/sprints",
  createCrudRouter(Sprint, [
    "projectId",
    "name",
  ])
);

router.use(
  "/tasks",
  createCrudRouter(Task, [
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
  ])
);

export default router;
