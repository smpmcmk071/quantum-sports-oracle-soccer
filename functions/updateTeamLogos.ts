import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FOOTY_LOGOS = {
  'CF Montreal': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f6212f32b0d0f68797d9e8_cf-montreal-footballlogos-org.svg',
  'Toronto FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f620fbe75643dfaa31ad10_toronto-fc-footballlogos-org.svg',
  'Orlando City': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f6208c52d2778fc56c85d1_orlando-city-footballlogos-org.svg',
  'Charlotte FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f62064914d9c66f36c8930_charlotte-fc-footballlogos-org.svg',
  'Nashville SC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61fb813a9f092156688ec_nashville-sc-footballlogos-org.svg',
  'Atlanta United FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61f8cb18b13f7e19e81ad_atlanta-united-footballlogos-org.svg',
  'D.C. United': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61f67604d7422cb5ffa28_dc-united-footballlogos-org.svg',
  'Philadelphia Union': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61f411458f15a7bb6dd68_philadelphia-union-footballlogos-org.svg',
  'New England Revolution': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61f0b1c1c36bdbb341b8c_new-england-revolution-footballlogos-org.svg',
  'New York Red Bulls': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61ee387dc80b84a80b255_new-york-red-bulls-footballlogos-org.svg',
  'New York City FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61ed1b78fb8c2f2a3f8f4_new-york-city-fc-footballlogos-org.svg',
  'Inter Miami CF': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f6218e88f8f8e8f8e8f8e8_inter-miami-cf-footballlogos-org.svg',
  'Chicago Fire': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61eaa4db8f15f7bb5dd68_chicago-fire-footballlogos-org.svg',
  'Columbus Crew': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61e817b1c36bdbb341b8c_columbus-crew-footballlogos-org.svg',
  'FC Cincinnati': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61e5c604d7422cb5ffa28_fc-cincinnati-footballlogos-org.svg',
  'Houston Dynamo': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61e34f15f7bb6dd68f15f_houston-dynamo-footballlogos-org.svg',
  'FC Dallas': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61dfd604d7422cb5ffa28_fc-dallas-footballlogos-org.svg',
  'Austin FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61dce8b0d36bdbb341b8c_austin-fc-footballlogos-org.svg',
  'Real Salt Lake': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61d9cb18b13f7e19e81ad_real-salt-lake-footballlogos-org.svg',
  'Colorado Rapids': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61d6eb18b13f7e19e81ad_colorado-rapids-footballlogos-org.svg',
  'FC Colorado': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61d6eb18b13f7e19e81ad_colorado-rapids-footballlogos-org.svg',
  'Los Angeles FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61d408b0d36bdbb341b8c_lafc-footballlogos-org.svg',
  'LAFC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61d408b0d36bdbb341b8c_lafc-footballlogos-org.svg',
  'LA Galaxy': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61d0ab18b13f7e19e81ad_la-galaxy-footballlogos-org.svg',
  'San Jose Earthquakes': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61cdbb18b13f7e19e81ad_san-jose-earthquakes-footballlogos-org.svg',
  'San Diego FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61ca88b0d36bdbb341b8c_san-diego-fc-footballlogos-org.svg',
  'Seattle Sounders FC': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61c788b0d36bdbb341b8c_seattle-sounders-fc-footballlogos-org.svg',
  'Portland Timbers': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61c4ab18b13f7e19e81ad_portland-timbers-footballlogos-org.svg',
  'Vancouver Whitecaps': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61c1cb18b13f7e19e81ad_vancouver-whitecaps-footballlogos-org.svg',
  'Sporting Kansas City': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61be18b0d36bdbb341b8c_sporting-kansas-city-footballlogos-org.svg',
  'Minnesota United': 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f61bb28b0d36bdbb341b8c_minnesota-united-footballlogos-org.svg',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const teams = await base44.asServiceRole.entities.Team.list(null, 100);
    let updated = 0;

    for (const team of teams) {
      const footyLogo = FOOTY_LOGOS[team.name];
      if (footyLogo && team.logo_url !== footyLogo) {
        await base44.asServiceRole.entities.Team.update(team.id, { logo_url: footyLogo });
        updated++;
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} team logos with FootyLogos SVG versions`,
      totalTeams: teams.length,
      updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});