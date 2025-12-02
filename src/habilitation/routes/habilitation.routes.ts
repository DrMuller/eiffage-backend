import express from "express";
import {
    getHabilitations,
    getHabilitationByIdHandler,
    createHabilitationHandler,
    updateHabilitationHandler,
    deleteHabilitationHandler,
} from "../controller/habilitation.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

router.get("/habilitations", [jwtMiddleware(['USER'])], getHabilitations);
// router.get("/habilitations/:id", [jwtMiddleware(['USER'])], getHabilitationByIdHandler);

// router.post("/habilitations", [jwtMiddleware(['USER', 'ADMIN'])], createHabilitationHandler);
// router.put("/habilitations/:id", [jwtMiddleware(['USER', 'ADMIN'])], updateHabilitationHandler);
// router.delete("/habilitations/:id", [jwtMiddleware(['USER', 'ADMIN'])], deleteHabilitationHandler);

export default router;

