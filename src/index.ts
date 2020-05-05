import Express, { Request, Response } from "express";
import checkSum from "./rgapi";
import cors from "cors";
import { getStats } from "./util";

import axios from "axios";
import rateLimit from "axios-rate-limit";

const app = Express();
const port = 3001;

app.use(cors());

app.get("/checkPlayerSummary/:summonerName", async (req, res) => {
  let results: object | void = await checkSum(
    req.params.summonerName,
    50
  ).catch((err) => {
    res.status(500).send(err);
  });
  let extractStats = getStats(results);
  extractStats["name"] = req.params.summonerName;
  res.send(extractStats);
});

app.get("/checkPlayerDetailed/:summonerName", async (req, res) => {
  let results: object = await checkSum(req.params.summonerName, 10);
  res.send(results);
});

app.listen(port, () => {
  console.log(`teamsux active on port ${port}`);
});
