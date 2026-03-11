import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const WIKIPEDIA_LOGOS = {
  "Atlanta United": "https://upload.wikimedia.org/wikipedia/commons/8/81/Atlanta_United_wordmark_black.svg",
  "Austin FC": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Austin_FC_wordmark_green.svg",
  "CF Montreal": "https://upload.wikimedia.org/wikipedia/commons/2/27/CF_Montreal_wordmark_white.svg",
  "Chicago Fire": "https://upload.wikimedia.org/wikipedia/commons/7/79/Chicago_Fire_SC_logo_tertiary.svg",
  "Colorado Rapids": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Colorado_Rapids_wordmark_blue.svg",
  "Columbus Crew": "https://upload.wikimedia.org/wikipedia/commons/d/dc/Columbus_Crew_logo_2021.svg",
  "D.C. United": "https://upload.wikimedia.org/wikipedia/commons/3/3e/D.C._United_wordmark_2024.svg",
  "FC Dallas": "https://upload.wikimedia.org/wikipedia/commons/a/a3/FC_Dallas_logo_2023.svg",
  "Houston Dynamo": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Houston_Dynamo_logo_2023.svg",
  "LA Galaxy": "https://upload.wikimedia.org/wikipedia/commons/3/36/LA_Galaxy_wordmark_white.svg",
  "LAFC": "https://upload.wikimedia.org/wikipedia/commons/4/46/Los_Angeles_Football_Club.svg",
  "Inter Miami": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Inter_Miami_CF_wordmark_pink.svg",
  "Minnesota United": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Minnesota_United_FC_logo_2024.svg",
  "New York City FC": "https://upload.wikimedia.org/wikipedia/commons/f/f2/New_York_City_FC_wordmark.svg",
  "New York Red Bulls": "https://upload.wikimedia.org/wikipedia/commons/4/40/New_York_Red_Bulls_logo.svg",
  "Philadelphia Union": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Philadelphia_Union_logo_2023.svg",
  "Portland Timbers": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Portland_Timbers_logo_2023.svg",
  "Real Salt Lake": "https://upload.wikimedia.org/wikipedia/commons/0/09/Real_Salt_Lake_logo.svg",
  "San Jose Earthquakes": "https://upload.wikimedia.org/wikipedia/commons/5/5b/San_Jose_Earthquakes_logo.svg",
  "Seattle Sounders": "https://upload.wikimedia.org/wikipedia/commons/4/47/Seattle_Sounders_FC_wordmark_green.svg",
  "Sporting Kansas City": "https://upload.wikimedia.org/wikipedia/commons/9/91/Sporting_Kansas_City_logo.svg",
  "Toronto FC": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Toronto_FC_crest.svg",
  "Vancouver Whitecaps": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Vancouver_Whitecaps_FC_logo.svg",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const teams = await base44.entities.Team.list();
    let updated = 0;
    const results = [];

    for (const team of teams) {
      const logoUrl = WIKIPEDIA_LOGOS[team.name];
      if (logoUrl) {
        await base44.entities.Team.update(team.id, { logo_url: logoUrl });
        updated++;
        results.push({ team: team.name, status: 'updated' });
      } else {
        results.push({ team: team.name, status: 'no_mapping' });
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} team logos from Wikipedia`,
      details: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});