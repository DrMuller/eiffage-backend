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
} from "../controller/job.controller";

const router = express.Router();

router.get("/jobs", getJobs);
router.get("/jobs/:id", getJobByIdHandler);
router.post("/jobs", createJobHandler);
router.put("/jobs/:id", updateJobHandler);
router.delete("/jobs/:id", deleteJobHandler);

router.get("/jobs/:id/skills", getJobSkillsHandler);
router.post("/jobs/:id/skills", addSkillToJobHandler);
router.put("/jobs/:id/skills/:skillId", updateJobSkillHandler);
router.delete("/jobs/:id/skills/:skillId", removeJobSkillHandler);

export default router;


