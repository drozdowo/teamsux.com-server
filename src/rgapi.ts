import { getNameFromId } from "./util";
import axios from "axios";
import rateLimit from "axios-rate-limit";
import CONFIG from "../config.js";

const API_KEY = CONFIG.API_KEY;

export default async (sumName, numMatches): Promise<object> => {
  const axiosRL = rateLimit(axios.create(), {
    maxRequests: 3,
    perMilliseconds: 1000,
  });

  //okay arguments are good
  console.log(`looking up last ${numMatches} of ${sumName}...`);

  let sumRes = await axiosRL
    .get(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${sumName}?api_key=${API_KEY}`
    )
    .catch((err) => {
      console.error("Error retrieving summoner information!", err.message, err);
      process.exit(1);
    });

  let userJson = sumRes.data;

  //okay now lets look at some matches

  let matches = await axiosRL
    .get(
      `https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${userJson.accountId}?api_key=${API_KEY}`,
      {
        params: {
          startIndex: 0,
          endIndex: numMatches,
        },
      }
    )
    .catch((err) => {
      console.error("Error fetching matches! - Error: ", err.message);
      process.exit(1);
    });

  return new Promise(async (resolve, reject) => {
    let result = {
      games: [],
    };
    let gameCount = 0;

    matches.data.matches.map(async (match) => {
      let game = await axiosRL
        .get(
          `https://na1.api.riotgames.com/lol/match/v4/matches/${match.gameId}?api_key=${API_KEY}`
        )
        .catch((err) => {
          console.error(`Error fetching MatchID ${match.gameId}!`, err.message);
        });
      let promises = [];

      promises.push(
        new Promise(async (resolve, reject) => {
          let thisGame = {
            me: null,
            teamWon:
              (game["data"].teams[0].win == "Win"
                ? game["data"].teams[0].teamId
                : game["data"].teams[1].teamId) == 100
                ? "Blue"
                : "Red",
            won: null,
            players: [],
          };
          await game["data"].participantIdentities.map((participant) => {
            if (participant.player.accountId == userJson.accountId) {
              thisGame.me = {
                participantId: participant.participantId,
                summonerName: participant.player.summonerName,
                team: participant.teamId == 100 ? "Blue" : "Red",
              };
            }
            thisGame.players.push({
              participantId: participant.participantId,
              summonerName: "REDACTED", //participant.player.summonerName,
              team: participant.teamId == 100 ? "Blue" : "Red",
            });
          });

          game["data"].participants.map(async (participant) => {
            thisGame.players.map((aPlayer) => {
              if (aPlayer.participantId == participant.participantId) {
                aPlayer.kills = participant.stats.kills;
                aPlayer.deaths = participant.stats.deaths;
                aPlayer.assists = participant.stats.assists;
                aPlayer.lane =
                  participant.timeline.role + " " + participant.timeline.lane;
                aPlayer.champion = getNameFromId(participant.championId);
                aPlayer.me =
                  participant.participantId == thisGame.me.participantId;
                aPlayer.team = participant.teamId == 100 ? "Blue" : "Red";
              }
            });
          });

          if (thisGame.me.team == thisGame.teamWon) {
            thisGame.won = true;
          } else {
            thisGame.won = false;
          }

          result.games.push(thisGame);
          if (++gameCount == numMatches) {
            resolve();
          }
        })
      );
      await Promise.all(promises);
      resolve(result);
    });
  });
};
