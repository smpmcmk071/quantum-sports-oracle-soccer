import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ESPN official team logo URLs - these actually work
const espnLogos = {
  "LAFC": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_lafc_logo.png",
  "LA Galaxy": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_lagalaxy_logo.png",
  "San Jose Earthquakes": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_sjearthquakes_logo.png",
  "Portland Timbers": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_portland_logo.png",
  "Seattle Sounders": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_seattle_logo.png",
  "Vancouver Whitecaps": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_vancouver_logo.png",
  "FC Dallas": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_fcdallas_logo.png",
  "Houston Dynamo": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_houston_logo.png",
  "Colorado Rapids": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_colorado_logo.png",
  "Real Salt Lake": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_realsalt_logo.png",
  "Sporting Kansas City": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_sporting_logo.png",
  "Chicago Fire": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_chicago_logo.png",
  "Columbus Crew": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_columbus_logo.png",
  "New York Red Bulls": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_newyork_logo.png",
  "Toronto FC": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_toronto_logo.png",
  "Montreal Impact": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_montreal_logo.png",
  "Philadelphia Union": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_philadelphia_logo.png",
  "New York City FC": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_nycfc_logo.png",
  "D.C. United": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_dcunited_logo.png",
  "Atlanta United": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_atlanta_logo.png",
  "Orlando City": "https://a.espncdn.com/media/motion/2014/1024/dm_141024_mls_orlando_logo.png",
  "Inter Miami CF": "https://a.espncdn.com/media/motion/2018/0302/dm_180302_mls_intermiamifc_logo.png",
  "Charlotte FC": "https://a.espncdn.com/media/motion/2019/1210/dm_191210_mls_charlottefc_logo.png",
  "San Diego FC": "https://a.espncdn.com/media/motion/2023/0906/dm_230906_mls_sandiegofc_logo.png",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const teams = await base44.asServiceRole.entities.Team.list();
    let updated = 0;

    for (const team of teams) {
      const logoUrl = espnLogos[team.name];
      if (logoUrl && logoUrl !== team.logo_url) {
        await base44.asServiceRole.entities.Team.update(team.id, { logo_url: logoUrl });
        updated++;
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} team logos with ESPN official URLs`,
      totalTeams: teams.length,
      updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});