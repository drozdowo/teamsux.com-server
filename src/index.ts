import Express from "express";
import checkSum from "./rgapi";
import cors from "cors";
import { getStats } from "./util";

const app = Express();
const port = 3001;

app.use(cors());

app.get("/checkPlayerSummary/:summonerName", async (req, res) => {
  let results: object | void = await checkSum(
    req.params.summonerName,
    15
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

/**
 *  Riot App:
 
TeamSux is a tool that would allow a player to enter their name, and receive a summarized report of their teams performance in the last X amount of games. This report would include some statistics like:
- Games where the user performed above a 1.0 KDA
- Games where the user performed worse than a 1.0 KDA
- Total amount of team mates that had a KDA less than Y
- Champions on your team that performed with a KDA of less than Y
- Roles on your team that performed with a KDA of less than Y

And eventually bringing more contextual information in, like Kill Participation, Objectives, Wards Placed, tower damage, and more.

I have redacted the ally names, and in the report that is generated for the user that entered their name, they wouldn't be to see any names. 



 */
