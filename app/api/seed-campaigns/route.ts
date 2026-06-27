import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slug(id: string) {
  return id
}
function now() {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const CAMPAIGNS = [
  // 1. Echoes of the Ice — Completed, Featured, AI Standard, Email ON/ON
  {
    id: 'cmp_echoes_ice',
    slug: 'echoes-of-the-ice',
    title: 'Echoes of the Ice',
    tagline: 'Co-authoring the Elegy of a Changing Climate',
    description:
      'A collaborative poetic movement tracking our changing ecosystems. Write your two lines to document climate resilience, changing seasons, and the collective hope for a sustainable planet.',
    instructions: [
      'Write exactly two lines of free verse — no more, no less.',
      'Keep each line under 100 characters so it reads cleanly in the poem.',
      'Stay close to the theme of climate and our shared planet.',
    ],
    theme: 'climate',
    accentColor: '#1f6f54',
    status: 'completed',
    featured: true,
    aiModeration: true,
    aiLevel: 'standard',
    backgroundImageUrl: '/placeholder.svg?height=600&width=960',
    videoLink: 'https://youtu.be/pEt6-jA2UE4',
    donationLink: 'https://www.unicef.org.uk/donate/',
    requireEmailVerification: true,
    autoEmailOnPublish: true,
    startDate: new Date('2026-06-01'),
    closeDate: new Date('2026-06-15'),
    partners: ['Planet Forward Alliance'],
    organiser:
      'Organized by the Planet Forward Alliance, an international grassroots network of environmental activists and digital storytellers specialized in building community-driven climate awareness.',
  },
  // 2. Silent Classrooms — Active, Featured, AI Standard, Email ON/ON
  {
    id: 'cmp_silent_class',
    slug: 'silent-classrooms',
    title: 'Silent Classrooms',
    tagline: 'Illuminating the Global Crises in Education',
    description:
      'Millions of children remain locked out of classrooms due to conflict, poverty, and infrastructure deficits. Add your lines to demand universal, accessible, and inclusive education for every child.',
    instructions: [
      'Write exactly two lines about education access or a child\'s right to learn.',
      'Keep each line under 100 characters.',
      'Reflect on a real story or universal truth.',
    ],
    theme: 'education',
    accentColor: '#1f6f54',
    status: 'active',
    featured: true,
    aiModeration: true,
    aiLevel: 'standard',
    backgroundImageUrl: '/placeholder.svg?height=600&width=960',
    videoLink: 'https://youtu.be/8FKR35OidyU',
    donationLink: 'https://www.unicef.org.uk/donate/',
    requireEmailVerification: true,
    autoEmailOnPublish: true,
    startDate: new Date('2026-06-01'),
    closeDate: new Date('2026-06-30'),
    partners: ['EduGlobal Trust'],
    organiser:
      'Launched by EduGlobal Trust, a non-profit dedicated to rebuilding learning centers in post-conflict zones and bringing open-source digital classrooms to remote regions.',
  },
  // 3. Shadows in the Mind — Active, Featured, AI OFF, Email OFF/OFF
  {
    id: 'cmp_shadows_mind',
    slug: 'shadows-in-the-mind',
    title: 'Shadows in the Mind',
    tagline: 'Breaking the Stigma Around Mental Health',
    description:
      'Mental health challenges thrive in isolation and silence. Contribute your couplet to give voice to the internal struggles, survival journeys, and the community structures needed for healing.',
    instructions: [
      'Write two lines about mental health, healing, or breaking stigma.',
      'Keep your verse honest, compassionate, and under 100 characters per line.',
      'You are not alone — every voice matters here.',
    ],
    theme: 'health',
    accentColor: '#1f6f54',
    status: 'active',
    featured: true,
    aiModeration: false,
    aiLevel: 'standard',
    backgroundImageUrl: '/placeholder.svg?height=600&width=960',
    videoLink: 'https://youtu.be/YdMCL9_UTE4',
    donationLink: 'https://unitedgmh.org/donate-to-united-for-global-mental-health/',
    requireEmailVerification: false,
    autoEmailOnPublish: false,
    startDate: new Date('2026-07-01'),
    closeDate: new Date('2026-07-31'),
    partners: ['MindMend Collective'],
    organiser:
      'Spearheaded by MindMend Collective, a coalition of mental health professionals, peer-support specialists, and creative arts therapists advocating for affordable community healthcare.',
  },
  // 4. Wired Isolation — Active, Not Featured, AI OFF, Email ON/ON
  {
    id: 'cmp_wired_iso',
    slug: 'wired-isolation',
    title: 'Wired Isolation',
    tagline: 'Finding Human Connection in a Hyper-Digital Age',
    description:
      'As our lives shift behind screens, algorithmic division and digital loneliness are rising. Share your verses exploring the balance between global connectivity and true human intimacy.',
    instructions: [
      'Write two lines about digital life, loneliness, or true connection.',
      'Keep each line under 100 characters.',
      'Draw from personal experience or observation.',
    ],
    theme: 'technology',
    accentColor: '#1f6f54',
    status: 'active',
    featured: false,
    aiModeration: false,
    aiLevel: 'lenient',
    backgroundImageUrl: '/placeholder.svg?height=600&width=960',
    videoLink: 'https://youtu.be/cEsXiRRAAZM',
    donationLink: 'https://www.unicef.org.uk/donate/',
    requireEmailVerification: true,
    autoEmailOnPublish: true,
    startDate: new Date('2026-06-01'),
    closeDate: new Date('2026-09-30'),
    partners: ['The Digital Cleanse Network'],
    organiser:
      'Initiated by The Digital Cleanse Network, an intersectional tech-advocacy group promoting humane technology designs, digital literacy, and mindful screen-life balance.',
  },
  // 5. Unseen Frameworks — Active, Not Featured, AI Standard, Email OFF/OFF
  {
    id: 'cmp_unseen_fw',
    slug: 'unseen-frameworks',
    title: 'Unseen Frameworks',
    tagline: 'Reimagining Cities for Universal Accessibility',
    description:
      'Modern urban centers are frequently built without accounting for diverse physical, sensory, and cognitive needs. Write your couplet to advocate for inclusive, barrier-free infrastructure and spaces.',
    instructions: [
      'Write two lines about accessibility, urban design, or inclusion.',
      'Keep each line under 100 characters.',
      'Centre the lived experience of disabled people in your verse.',
    ],
    theme: 'urban',
    accentColor: '#1f6f54',
    status: 'active',
    featured: false,
    aiModeration: true,
    aiLevel: 'standard',
    backgroundImageUrl: '/placeholder.svg?height=600&width=960',
    videoLink: 'https://youtu.be/gFTcHsbZblA',
    donationLink: 'https://www.unicef.org.uk/donate/',
    requireEmailVerification: false,
    autoEmailOnPublish: false,
    startDate: new Date('2026-06-01'),
    closeDate: new Date('2026-08-31'),
    partners: ['AccessUrban Labs'],
    organiser:
      'Curated by AccessUrban Labs, an architectural advocacy team collaborating with disability rights groups to build universally accessible public spaces and inclusive smart-city layouts.',
  },
  // 6. The Thirsty Soil — Active, Featured, AI Standard, Email ON/OFF
  {
    id: 'cmp_thirsty_soil',
    slug: 'the-thirsty-soil',
    title: 'The Thirsty Soil',
    tagline: 'Giving Voice to a World Running Dry',
    description:
      'Clean water is a fundamental human right, yet vanishing aquifers and polluted lifelines threaten billions. Add your two lines to document the struggle for clean hydration, resource scarcity, and the collective defence of our blue planet.',
    instructions: [
      'Write exactly two lines about water, rivers, or the right to clean hydration.',
      'Keep each line under 100 characters.',
      'Draw from local knowledge or global solidarity.',
    ],
    theme: 'water',
    accentColor: '#1f6f54',
    status: 'active',
    featured: true,
    aiModeration: true,
    aiLevel: 'standard',
    backgroundImageUrl: '/placeholder.svg?height=600&width=960',
    videoLink: 'https://youtu.be/C65iqOSCZOY',
    donationLink: 'https://www.unicef.org.uk/donate/',
    requireEmailVerification: true,
    autoEmailOnPublish: false,
    startDate: new Date('2026-06-01'),
    closeDate: new Date('2026-12-31'),
    partners: ['PureStream International'],
    organiser:
      'Spearheaded by PureStream International, a global WASH (Water, Sanitation, and Hygiene) NGO focused on implementing community-owned solar well infrastructure and monitoring freshwater biodiversity.',
  },
]

// Authors keyed by email to avoid duplicates
const AUTHORS_BY_EMAIL: Record<
  string,
  { id: string; name: string; email: string; country: string }
> = {
  'sarah.j@planetforward.org':      { id: 'aut_sarah_j',   name: 'Sarah Jenkins',   email: 'sarah.j@planetforward.org',      country: 'South Africa' },
  'mchen.eco@webmail.com':           { id: 'aut_michael_c', name: 'Michael Chen',    email: 'mchen.eco@webmail.com',           country: 'South Africa' },
  'elena.ros@ecosphere.net':         { id: 'aut_elena_r',   name: 'Elena Rostova',   email: 'elena.ros@ecosphere.net',         country: 'South Africa' },
  'amara.writes@greenhub.org':       { id: 'aut_amara_o',   name: 'Amara Okafor',    email: 'amara.writes@greenhub.org',       country: 'South Africa' },
  'liam.oconnor@earthguard.io':      { id: 'aut_liam_o',    name: "Liam O'Connor",   email: 'liam.oconnor@earthguard.io',      country: 'South Africa' },
  'dmiller@eduglobal.org':           { id: 'aut_david_m',   name: 'David Miller',    email: 'dmiller@eduglobal.org',           country: 'Indonesia' },
  'zainab.h@learnliberty.net':       { id: 'aut_zainab_h',  name: 'Zainab Al-Hassan',email: 'zainab.h@learnliberty.net',      country: 'Indonesia' },
  'ravi.kumar@villagelearn.org':     { id: 'aut_ravi_k',    name: 'Ravi Kumar',      email: 'ravi.kumar@villagelearn.org',     country: 'Malaysia' },
  'sofia.mendes@teachersunite.io':   { id: 'aut_sofia_m',   name: 'Sofia Mendes',    email: 'sofia.mendes@teachersunite.io',   country: 'Malaysia' },
  'mvance@classroomforward.com':     { id: 'aut_marcus_v',  name: 'Marcus Vance',    email: 'mvance@classroomforward.com',     country: 'Singapore' },
  'clara.o@mindmend.org':            { id: 'aut_clara_o',   name: 'Clara Oswald',    email: 'clara.o@mindmend.org',            country: 'United Kingdom' },
  'jordan.b@mentalhealthadvocates.net': { id: 'aut_jordan_b', name: 'Jordan Brooks', email: 'jordan.b@mentalhealthadvocates.net', country: 'United Kingdom' },
  'aisha.bello@peerheal.org':        { id: 'aut_aisha_b',   name: 'Aisha Bello',     email: 'aisha.bello@peerheal.org',        country: 'United Kingdom' },
  'ytanaka@healingarts.io':          { id: 'aut_yuki_t',    name: 'Yuki Tanaka',     email: 'ytanaka@healingarts.io',          country: 'Sweden' },
  'twright@silencebreaks.com':       { id: 'aut_thomas_w',  name: 'Thomas Wright',   email: 'twright@silencebreaks.com',       country: 'Sweden' },
  'felix@digitalcleanse.org':        { id: 'aut_felix_v',   name: 'Felix Vance',     email: 'felix@digitalcleanse.org',        country: 'India' },
  'maya.lin@sociotech.net':          { id: 'aut_maya_l',    name: 'Maya Lin',         email: 'maya.lin@sociotech.net',          country: 'India' },
  'lucas.g@humanetech.io':           { id: 'aut_lucas_g',   name: 'Lucas Geller',    email: 'lucas.g@humanetech.io',           country: 'India' },
  'nina.s@offlineconnect.com':       { id: 'aut_nina_s',    name: 'Nina Simone',     email: 'nina.s@offlineconnect.com',       country: 'India' },
  'dev.patel@communityroot.org':     { id: 'aut_dev_p',     name: 'Dev Patel',        email: 'dev.patel@communityroot.org',     country: 'India' },
  'arthur@accessurban.org':          { id: 'aut_arthur_p',  name: 'Arthur Pendelton',email: 'arthur@accessurban.org',          country: 'United Kingdom' },
  'chloe.d@inclusivecities.net':     { id: 'aut_chloe_d',   name: 'Chloe Dupont',    email: 'chloe.d@inclusivecities.net',     country: 'United Kingdom' },
  'sam.wilson@neurodiversespace.io': { id: 'aut_sam_w',     name: 'Sam Wilson',      email: 'sam.wilson@neurodiversespace.io', country: 'Germany' },
  'fatima.as@designforall.org':      { id: 'aut_fatima_a',  name: 'Fatima Al-Sayed', email: 'fatima.as@designforall.org',      country: 'Germany' },
  'julian@universalaccess.com':      { id: 'aut_julian_v',  name: 'Julian Vance',    email: 'julian@universalaccess.com',      country: 'Germany' },
  'sam.m@purestream.org':            { id: 'aut_samuel_m',  name: 'Samuel Mwangi',   email: 'sam.m@purestream.org',            country: 'India' },
  'priya.nair@hydrology.net':        { id: 'aut_priya_n',   name: 'Priya Nair',      email: 'priya.nair@hydrology.net',        country: 'India' },
  'carlos.s@aquafuture.io':          { id: 'aut_carlos_s',  name: 'Carlos Silva',    email: 'carlos.s@aquafuture.io',          country: 'India' },
  'jess.taylor@blueplanet.org':      { id: 'aut_jessica_t', name: 'Jessica Taylor',  email: 'jess.taylor@blueplanet.org',      country: 'India' },
  'aarav.mehta@earthwell.com':       { id: 'aut_aarav_m',   name: 'Aarav Mehta',     email: 'aarav.mehta@earthwell.com',       country: 'India' },
}

// Contributions keyed by campaign → couplets in order
const CONTRIBUTIONS: Array<{
  id: string
  campaignId: string
  seq: number
  lineOne: string
  lineTwo: string
  authorEmail: string
}> = [
  // Echoes of the Ice
  { id: 'ctr_ei_01', campaignId: 'cmp_echoes_ice', seq: 1, lineOne: 'The ancient glaciers whisper to the rising sea,', lineTwo: 'A frozen archive melting into history.', authorEmail: 'sarah.j@planetforward.org' },
  { id: 'ctr_ei_02', campaignId: 'cmp_echoes_ice', seq: 2, lineOne: 'Where green fields cracked beneath a blazing summer sun,', lineTwo: "We count the drops of water till the day is done.", authorEmail: 'mchen.eco@webmail.com' },
  { id: 'ctr_ei_03', campaignId: 'cmp_echoes_ice', seq: 3, lineOne: 'The migratory birds return to altered shores,', lineTwo: "Re-mapping paths across the wind's changing floors.", authorEmail: 'elena.ros@ecosphere.net' },
  { id: 'ctr_ei_04', campaignId: 'cmp_echoes_ice', seq: 4, lineOne: 'Beneath the smog-choked sky, a single seed takes root,', lineTwo: 'The silent revolution of a concrete shoot.', authorEmail: 'amara.writes@greenhub.org' },
  { id: 'ctr_ei_05', campaignId: 'cmp_echoes_ice', seq: 5, lineOne: 'We hold the future gently in our calloused hands,', lineTwo: 'To heal the broken rhythms of our shared lands.', authorEmail: 'liam.oconnor@earthguard.io' },
  // Silent Classrooms
  { id: 'ctr_sc_01', campaignId: 'cmp_silent_class', seq: 1, lineOne: 'A locked gate stands where eager minds should learn to read,', lineTwo: "The heavy chalkboard starves a generation's need.", authorEmail: 'dmiller@eduglobal.org' },
  { id: 'ctr_sc_02', campaignId: 'cmp_silent_class', seq: 2, lineOne: 'She draws her lessons in the dust outside the tent,', lineTwo: 'A brilliant mind on which no textbook coins were spent.', authorEmail: 'zainab.h@learnliberty.net' },
  { id: 'ctr_sc_03', campaignId: 'cmp_silent_class', seq: 3, lineOne: 'The village built a roof of thatch to block the rain,', lineTwo: "So letters could survive to break the cycle's chain.", authorEmail: 'ravi.kumar@villagelearn.org' },
  { id: 'ctr_sc_04', campaignId: 'cmp_silent_class', seq: 4, lineOne: 'Beyond the border lines where heavy shadows fall,', lineTwo: "A teacher sparks a light to answer freedom's call.", authorEmail: 'sofia.mendes@teachersunite.io' },
  { id: 'ctr_sc_05', campaignId: 'cmp_silent_class', seq: 5, lineOne: 'Give us the ink and paper, give the world the key,', lineTwo: 'To unlock minds that modern struggles fail to see.', authorEmail: 'mvance@classroomforward.com' },
  // Shadows in the Mind
  { id: 'ctr_sm_01', campaignId: 'cmp_shadows_mind', seq: 1, lineOne: 'A heavy armor worn to mask the quiet storm,', lineTwo: 'While searching for a gentle space to keep us warm.', authorEmail: 'clara.o@mindmend.org' },
  { id: 'ctr_sm_02', campaignId: 'cmp_shadows_mind', seq: 2, lineOne: 'The loudest laughter sometimes hides the deepest ache,', lineTwo: 'A brittle glass that bends but prays it will not break.', authorEmail: 'jordan.b@mentalhealthadvocates.net' },
  { id: 'ctr_sm_03', campaignId: 'cmp_shadows_mind', seq: 3, lineOne: 'We sit together in the dark until it clears,', lineTwo: 'Dismantling the architecture of our fears.', authorEmail: 'aisha.bello@peerheal.org' },
  { id: 'ctr_sm_04', campaignId: 'cmp_shadows_mind', seq: 4, lineOne: 'The morning comes with hesitation, slow and grey,', lineTwo: 'But step by step, we carry each other through the day.', authorEmail: 'ytanaka@healingarts.io' },
  { id: 'ctr_sm_05', campaignId: 'cmp_shadows_mind', seq: 5, lineOne: 'Speak out the words that shame has hidden out of sight,', lineTwo: 'For vulnerabilities exposed are brought to light.', authorEmail: 'twright@silencebreaks.com' },
  // Wired Isolation
  { id: 'ctr_wi_01', campaignId: 'cmp_wired_iso', seq: 1, lineOne: 'A thousand digital companions click and fade,', lineTwo: 'Within the lonely blue-light sanctuaries we made.', authorEmail: 'felix@digitalcleanse.org' },
  { id: 'ctr_wi_02', campaignId: 'cmp_wired_iso', seq: 2, lineOne: 'We scroll through lives of strangers looking for a spark,', lineTwo: 'And leave our true emotions dynamic in the dark.', authorEmail: 'maya.lin@sociotech.net' },
  { id: 'ctr_wi_03', campaignId: 'cmp_wired_iso', seq: 3, lineOne: 'The algorithm feeds the anger on the screen,', lineTwo: 'Displacing quiet moments that exist between.', authorEmail: 'lucas.g@humanetech.io' },
  { id: 'ctr_wi_04', campaignId: 'cmp_wired_iso', seq: 4, lineOne: "Put down the glass, look up into the neighbor's eyes,", lineTwo: 'Before the native language of connection dies.', authorEmail: 'nina.s@offlineconnect.com' },
  { id: 'ctr_wi_05', campaignId: 'cmp_wired_iso', seq: 5, lineOne: 'Let data streams give way to tactile, breathing space,', lineTwo: 'And find our solace in a warm, unmediated face.', authorEmail: 'dev.patel@communityroot.org' },
  // Unseen Frameworks
  { id: 'ctr_uf_01', campaignId: 'cmp_unseen_fw', seq: 1, lineOne: 'A flight of stairs becomes a mountain steep and tall,', lineTwo: 'When urban planning builds an invisible, concrete wall.', authorEmail: 'arthur@accessurban.org' },
  { id: 'ctr_uf_02', campaignId: 'cmp_unseen_fw', seq: 2, lineOne: 'The silent signs are blank to those who cannot see,', lineTwo: 'We need a sensory path to set our movement free.', authorEmail: 'chloe.d@inclusivecities.net' },
  { id: 'ctr_uf_03', campaignId: 'cmp_unseen_fw', seq: 3, lineOne: 'The flashing lights and roaring engines overwhelm,', lineTwo: 'Leave quiet corners in the crowded public realm.', authorEmail: 'sam.wilson@neurodiversespace.io' },
  { id: 'ctr_uf_04', campaignId: 'cmp_unseen_fw', seq: 4, lineOne: 'A ramp, a tone, a textured curb along the street,', lineTwo: 'Ensures that every citizen has space to meet.', authorEmail: 'fatima.as@designforall.org' },
  { id: 'ctr_uf_05', campaignId: 'cmp_unseen_fw', seq: 5, lineOne: "True design isn't finished till the last barrier falls,", lineTwo: 'And hospitality echoes through our public halls.', authorEmail: 'julian@universalaccess.com' },
  // The Thirsty Soil
  { id: 'ctr_ts_01', campaignId: 'cmp_thirsty_soil', seq: 1, lineOne: 'The rusted pump yields nothing but a hollow sound,', lineTwo: 'While children walk for miles across the burning ground.', authorEmail: 'sam.m@purestream.org' },
  { id: 'ctr_ts_02', campaignId: 'cmp_thirsty_soil', seq: 2, lineOne: 'The mighty river shrinks into a silver thread,', lineTwo: 'A dying vein where ancient civilizations bled.', authorEmail: 'priya.nair@hydrology.net' },
  { id: 'ctr_ts_03', campaignId: 'cmp_thirsty_soil', seq: 3, lineOne: 'We pour our toxins down into the deep well\'s dark,', lineTwo: 'Then wonder why the water loses its life-giving spark.', authorEmail: 'carlos.s@aquafuture.io' },
  { id: 'ctr_ts_04', campaignId: 'cmp_thirsty_soil', seq: 4, lineOne: 'A plastic bottle bought where natural springs ran free,', lineTwo: 'The commodification of what belongs to you and me.', authorEmail: 'jess.taylor@blueplanet.org' },
  { id: 'ctr_ts_05', campaignId: 'cmp_thirsty_soil', seq: 5, lineOne: 'Protect the rain, restore the water to the stream,', lineTwo: 'For every drop sustains the global, living dream.', authorEmail: 'aarav.mehta@earthwell.com' },
]

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    console.log('[SEED] Wiping existing data...')
    await query('DELETE FROM moderation_settings')
    await query('DELETE FROM seed_couplets')
    await query('DELETE FROM contributions')
    await query('DELETE FROM authors')
    await query('DELETE FROM campaigns')
    console.log('[SEED] Tables cleared.')

    // -----------------------------------------------------------------------
    // Insert campaigns
    // -----------------------------------------------------------------------
    console.log('[SEED] Inserting campaigns...')
    for (const c of CAMPAIGNS) {
      await query(
        `INSERT INTO campaigns (
           id, slug, title, tagline, description, instructions, theme, accent_color,
           status, featured, ai_moderation, ai_level,
           background_image_url, campaign_images,
           video_link, donation_link,
           require_email_verification, auto_email_on_publish,
           partners, start_date, close_date, created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,
           $9,$10,$11,$12,
           $13,$14,
           $15,$16,
           $17,$18,
           $19,$20,$21,NOW(),NOW()
         )`,
        [
          c.id, c.slug, c.title, c.tagline, c.description,
          c.instructions, c.theme, c.accentColor,
          c.status, c.featured, c.aiModeration, c.aiLevel,
          c.backgroundImageUrl, [],
          c.videoLink, c.donationLink,
          c.requireEmailVerification, c.autoEmailOnPublish,
          c.partners, c.startDate, c.closeDate,
        ],
      )
      console.log(`[SEED]   campaign: ${c.title}`)
    }

    // -----------------------------------------------------------------------
    // Insert moderation settings
    // -----------------------------------------------------------------------
    console.log('[SEED] Inserting moderation settings...')
    for (const c of CAMPAIGNS) {
      if (!c.aiModeration) continue
      const msId = `mds_${c.id}`
      await query(
        `INSERT INTO moderation_settings (
           id, campaign_id, level, profanity_filter, enforce_theme, confidence_threshold, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
        [msId, c.id, c.aiLevel, true, true, 0.70],
      )
    }

    // -----------------------------------------------------------------------
    // Insert authors (deduplicated)
    // -----------------------------------------------------------------------
    console.log('[SEED] Inserting authors...')
    const joinedBase = new Date('2026-05-20T08:00:00.000Z')
    let offset = 0
    for (const a of Object.values(AUTHORS_BY_EMAIL)) {
      const joinedAt = new Date(joinedBase.getTime() + offset * 3_600_000).toISOString()
      await query(
        `INSERT INTO authors (id, name, email, country, status, joined_at)
         VALUES ($1,$2,$3,$4,'active',$5)`,
        [a.id, a.name, a.email, a.country, joinedAt],
      )
      offset++
    }
    console.log(`[SEED]   ${Object.keys(AUTHORS_BY_EMAIL).length} authors inserted.`)

    // -----------------------------------------------------------------------
    // Insert contributions (all approved — they form the poem)
    // and seed_couplets (the admin-visible seed record)
    // -----------------------------------------------------------------------
    console.log('[SEED] Inserting contributions + seed couplets...')
    const contribBase = new Date('2026-06-01T08:00:00.000Z')
    for (let i = 0; i < CONTRIBUTIONS.length; i++) {
      const ct = CONTRIBUTIONS[i]
      const author = AUTHORS_BY_EMAIL[ct.authorEmail]
      if (!author) {
        console.error(`[SEED] Unknown author email: ${ct.authorEmail}`)
        continue
      }
      const createdAt = new Date(contribBase.getTime() + i * 2_700_000).toISOString()

      await query(
        `INSERT INTO contributions (
           id, campaign_id, sequence_number, line_one, line_two,
           author_id, status, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'approved',$7)`,
        [ct.id, ct.campaignId, ct.seq, ct.lineOne, ct.lineTwo, author.id, createdAt],
      )

      const scId = `sc_${ct.id}`
      await query(
        `INSERT INTO seed_couplets (
           id, campaign_id, sequence_number, line_one, line_two, author, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [scId, ct.campaignId, ct.seq, ct.lineOne, ct.lineTwo, author.name, createdAt],
      )
    }
    console.log(`[SEED]   ${CONTRIBUTIONS.length} contributions + seed couplets inserted.`)

    console.log('[SEED] Done.')
    const response = NextResponse.json(
      {
        success: true,
        message: 'Demo data seeded successfully.',
        summary: {
          campaigns: CAMPAIGNS.length,
          authors: Object.keys(AUTHORS_BY_EMAIL).length,
          contributions: CONTRIBUTIONS.length,
        },
      },
      { status: 200 },
    )
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response
  } catch (error) {
    console.error('[SEED] Error:', error)
    const response = NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response
  }
}
