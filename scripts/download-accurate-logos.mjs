import fs from "fs";
import path from "path";
import https from "https";

const TEAMS = [
  { id: "arsenal", url: "https://a.espncdn.com/i/teamlogos/soccer/500/359.png" },
  { id: "man-city", url: "https://a.espncdn.com/i/teamlogos/soccer/500/382.png" },
  { id: "liverpool", url: "https://a.espncdn.com/i/teamlogos/soccer/500/364.png" },
  { id: "chelsea", url: "https://a.espncdn.com/i/teamlogos/soccer/500/363.png" },
  { id: "real-madrid", url: "https://a.espncdn.com/i/teamlogos/soccer/500/86.png" },
  { id: "barcelona", url: "https://a.espncdn.com/i/teamlogos/soccer/500/83.png" },
  { id: "bayern-munich", url: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png" },
  { id: "dortmund", url: "https://a.espncdn.com/i/teamlogos/soccer/500/124.png" },
  { id: "inter-milan", url: "https://a.espncdn.com/i/teamlogos/soccer/500/110.png" },
  { id: "juventus", url: "https://a.espncdn.com/i/teamlogos/soccer/500/111.png" },
  { id: "ac-milan", url: "https://a.espncdn.com/i/teamlogos/soccer/500/103.png" },
  { id: "man-united", url: "https://a.espncdn.com/i/teamlogos/soccer/500/360.png" },
  { id: "tottenham", url: "https://a.espncdn.com/i/teamlogos/soccer/500/367.png" },
  { id: "aston-villa", url: "https://a.espncdn.com/i/teamlogos/soccer/500/362.png" },
  { id: "newcastle", url: "https://a.espncdn.com/i/teamlogos/soccer/500/361.png" },
  { id: "psg", url: "https://a.espncdn.com/i/teamlogos/soccer/500/160.png" },
  { id: "lakers", url: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png" },
  { id: "warriors", url: "https://a.espncdn.com/i/teamlogos/nba/500/gsw.png" },
  { id: "celtics", url: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png" },
  { id: "bucks", url: "https://a.espncdn.com/i/teamlogos/nba/500/mil.png" },
  { id: "ufc", url: "https://a.espncdn.com/i/teamlogos/mma/500/ufc.png" },
];

const LEAGUES = [
  { id: "premier-league", url: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png" },
  { id: "champions-league", url: "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png" },
  { id: "la-liga", url: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png" },
  { id: "serie-a", url: "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png" },
  { id: "bundesliga", url: "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png" },
  { id: "nba", url: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        // Verify PNG magic bytes: 89 50 4E 47
        if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
          return reject(new Error(`Invalid PNG format from ${url}`));
        }
        fs.writeFileSync(destPath, buffer);
        resolve({ path: destPath, size: buffer.length });
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function run() {
  const teamsDir = path.resolve("/root/sckoll/public/logos/teams");
  const leaguesDir = path.resolve("/root/sckoll/public/logos/leagues");

  fs.mkdirSync(teamsDir, { recursive: true });
  fs.mkdirSync(leaguesDir, { recursive: true });

  console.log("Downloading accurate team logos...");
  for (const team of TEAMS) {
    const dest = path.join(teamsDir, `${team.id}.png`);
    try {
      const res = await downloadFile(team.url, dest);
      console.log(`✓ [Team] ${team.id} (${(res.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ [Team] ${team.id} error:`, err.message);
    }
  }

  console.log("\nDownloading accurate league logos...");
  for (const league of LEAGUES) {
    const dest = path.join(leaguesDir, `${league.id}.png`);
    try {
      const res = await downloadFile(league.url, dest);
      console.log(`✓ [League] ${league.id} (${(res.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ [League] ${league.id} error:`, err.message);
    }
  }
}

run();
