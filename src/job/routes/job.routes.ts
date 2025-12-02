import express from "express";
import {
    getJobs,
    getJobByIdHandler,
    createJobHandler,
    updateJobHandler,
    deleteJobHandler,
    getJobSkillsHandler,
    addSkillToJobHandler,
    updateJobSkillHandler,
    removeJobSkillHandler,
    getJobSkillLevelDistributionHandler,
} from "../controller/job.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

router.get("/jobs", [jwtMiddleware(['USER'])], getJobs);
router.get("/jobs/:id", [jwtMiddleware(['USER'])], getJobByIdHandler);

router.post("/jobs", [jwtMiddleware(['USER', 'ADMIN'])], createJobHandler);
router.put("/jobs/:id", [jwtMiddleware(['USER', 'ADMIN'])], updateJobHandler);
router.delete("/jobs/:id", [jwtMiddleware(['USER', 'ADMIN'])], deleteJobHandler);

router.get("/jobs/:id/skills/distribution", [jwtMiddleware(['USER'])], getJobSkillLevelDistributionHandler);
router.get("/jobs/:id/skills", [jwtMiddleware(['USER'])], getJobSkillsHandler);

router.post("/jobs/:id/skills", [jwtMiddleware(['USER', 'ADMIN'])], addSkillToJobHandler);
router.put("/jobs/:id/skills/:skillId", [jwtMiddleware(['USER', 'ADMIN'])], updateJobSkillHandler);
router.delete("/jobs/:id/skills/:skillId", [jwtMiddleware(['USER', 'ADMIN'])], removeJobSkillHandler);

export default router;


