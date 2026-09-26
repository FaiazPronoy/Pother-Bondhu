import express from "express";
import {createTeam, listTeams, getTeamByKey, getMyTeams, getAllTeams, postTeamActivity} from "../controllers/teamController.js";
import userAuth from "../middleware/userAuth.js";

const teamRouter = express.Router();

teamRouter.post("/", userAuth, createTeam);
teamRouter.get("/my-teams", userAuth, getMyTeams);
teamRouter.get('/all', getAllTeams);
teamRouter.get('/', listTeams);    
teamRouter.get('/:key', getTeamByKey);
teamRouter.post('/:teamId/activity', userAuth, postTeamActivity);


export default teamRouter;
