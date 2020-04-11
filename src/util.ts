import fs from "fs";
import path from "path";

const FEEDER_RATIO = 0.33;

const getNameFromId = (champId) => {
  let file = fs.readFileSync(path.join(__dirname, "data.json")).toString();
  let data = JSON.parse(file);
  let result = Object.keys(data.data).filter((key) => {
    if (data.data[key]["key"] === champId.toString()) {
      return true;
    }
  });
  return result ? result[0] : {};
};

const getStats = (results) => {
  let gamesMoreThan1 = 0;
  let gamesLessThan1 = 0;
  let feeders = 0;
  let feederChampMap = {};
  let feederRoleMap = {};
  let lossesWithAFeeder = 0;
  let lossesMoreThan1Feeder = 0;

  results.games.map((game) => {
    let feedersThisGame = 0;
    game.players.map((player) => {
      //Check games doing better than 1 KDA
      if (player.me == true) {
        gamesMoreThan1 +=
          (player.kills + player.assists) / player.deaths >= 1 ? 1 : 0;
        gamesLessThan1 +=
          (player.kills + player.assists) / player.deaths < 1 ? 1 : 0;
      } else {
        //other players
        if ((player.kills + player.assists) / player.deaths < FEEDER_RATIO) {
          //Increment these stats
          feedersThisGame++;
          feeders++;

          //Update our map with feeder champs
          if (feederChampMap[player.champion]) {
            feederChampMap[player.champion]++;
          } else {
            feederChampMap[player.champion] = 1;
          }
          //Update our map of feeder roles
          if (feederRoleMap[player.lane]) {
            feederRoleMap[player.lane]++;
          } else {
            feederRoleMap[player.lane] = 1;
          }
        }
      }
    });
    if (feedersThisGame > 0 && !game.won) {
      lossesWithAFeeder++;
      if (feedersThisGame > 1) {
        lossesMoreThan1Feeder++;
      }
    }
  });
  return {
    gamesMoreThan1,
    gamesLessThan1,
    feeders,
    feederChampMap,
    feederRoleMap,
    lossesWithAFeeder,
    lossesMoreThan1Feeder,
  };
};

export { getNameFromId, getStats };
