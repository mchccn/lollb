import "dotenv/config";
import fetch from "node-fetch";
import Table from "ascii-table";

const MASTERY_URL =
  "https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/";
const PROFILE_URL =
  "https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/";
const CHALLENGES_URL =
  "https://na1.api.riotgames.com/lol/challenges/v1/player-data/";

const users = process.argv.slice(2);

(async () => {
  const profiles = await Promise.all(
    users.map((name) =>
      fetch(
        PROFILE_URL +
          encodeURIComponent(name) +
          `?api_key=${process.env.API_KEY}`
      ).then((res) => res.json())
    )
  );

  console.log(profiles);

  const masteries = await Promise.all(
    profiles.map(({ id }) =>
      fetch(MASTERY_URL + id + `?api_key=${process.env.API_KEY}`).then((res) =>
        res.json()
      )
    )
  );

  const challenges = await Promise.all(
    profiles.map(({ puuid }) =>
      fetch(CHALLENGES_URL + puuid + `?api_key=${process.env.API_KEY}`).then(
        (res) => res.json()
      )
    )
  );

  const entries = profiles
    .map(({ name, summonerLevel: level }, i) => ({
      name,
      level,
      count: masteries[i].length,
      score: masteries[i].reduce((s, c) => s + c.championLevel, 0),
      points: masteries[i].reduce((p, c) => p + c.championPoints, 0),
      chests: `${masteries[i].reduce((t, c) => t + +c.chestGranted, 0)}/${
        masteries[i].length
      }`,
      challenges: challenges[i].totalPoints.current,
    }))
    .sort((a, b) => b.points - a.points);

  const lb = new Table("Addiction Leaderboard");

  lb.setHeading(
    "name",
    "level",
    "champs",
    "score",
    "points",
    "chests",
    "challenges"
  );

  entries.forEach(({ name, level, count, score, points, chests, challenges }) =>
    lb.addRow(name, level, count, score, points, chests, challenges)
  );

  console.log(lb.toString());
})();
