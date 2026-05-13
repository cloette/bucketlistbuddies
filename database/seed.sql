-- =============================================================================
-- BUCKET LIST BUDDIES — SEED DATA
-- Run this after schema.sql. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- =============================================================================


-- =============================================================================
-- CATEGORIES
-- =============================================================================
INSERT INTO categories (name, slug) VALUES
  ('Travel',           'travel'),
  ('Adventure',        'adventure'),
  ('Food & Drink',     'food-drink'),
  ('Arts & Culture',   'arts-culture'),
  ('Sports & Fitness', 'sports-fitness'),
  ('Learning',         'learning'),
  ('Nature',           'nature'),
  ('Social',           'social'),
  ('Wellness',         'wellness'),
  ('Career',           'career'),
  ('Other',            'other')
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- IDEAS
-- =============================================================================
INSERT INTO ideas (title, description, category_id, country) VALUES

  -- Travel
  ('See the Northern Lights',
   'Watch the aurora borealis ripple across the Arctic night sky.',
   (SELECT id FROM categories WHERE slug = 'travel'), 'Norway'),

  ('Ride the Trans-Siberian Railway',
   'Take the world''s longest railway journey from Moscow to Vladivostok across eight time zones.',
   (SELECT id FROM categories WHERE slug = 'travel'), 'Russia'),

  ('Visit all seven continents',
   'Set foot on every continent, including a trip to Antarctica.',
   (SELECT id FROM categories WHERE slug = 'travel'), 'anywhere'),

  ('Spend a week in a Japanese ryokan',
   'Stay in a traditional inn, sleep on tatami, and experience kaiseki dining.',
   (SELECT id FROM categories WHERE slug = 'travel'), 'Japan'),

  ('Road trip Route 66',
   'Drive the full length of America''s historic Mother Road from Chicago to Santa Monica.',
   (SELECT id FROM categories WHERE slug = 'travel'), 'USA'),

  -- Adventure
  ('Go skydiving',
   'Jump from a plane at altitude and freefall before the parachute opens.',
   (SELECT id FROM categories WHERE slug = 'adventure'), 'anywhere'),

  ('Bungee jump off a bridge',
   'Take the leap from a high bridge with only a bungee cord between you and the water below.',
   (SELECT id FROM categories WHERE slug = 'adventure'), 'anywhere'),

  ('White-water raft a Class V river',
   'Navigate rapids rated at the highest recreational difficulty on a guided expedition.',
   (SELECT id FROM categories WHERE slug = 'adventure'), 'anywhere'),

  ('Hike the Inca Trail to Machu Picchu',
   'Trek through cloud forest and Andean passes to arrive at the Sun Gate at dawn.',
   (SELECT id FROM categories WHERE slug = 'adventure'), 'Peru'),

  ('Go cage diving with great white sharks',
   'Come face-to-face with the ocean''s apex predator from the safety of a submerged cage.',
   (SELECT id FROM categories WHERE slug = 'adventure'), 'South Africa'),

  -- Food & Drink
  ('Eat at a Michelin-starred restaurant',
   'Experience world-class cuisine crafted by a celebrated chef.',
   (SELECT id FROM categories WHERE slug = 'food-drink'), 'anywhere'),

  ('Take a cooking class in a foreign country',
   'Learn to make authentic local dishes from a local chef in their home kitchen.',
   (SELECT id FROM categories WHERE slug = 'food-drink'), 'anywhere'),

  ('Visit a working vineyard during harvest',
   'Help pick grapes and taste wine straight from the barrel during the vendange season.',
   (SELECT id FROM categories WHERE slug = 'food-drink'), 'France'),

  ('Eat your way through a street-food market',
   'Spend an entire day sampling dishes from a legendary open-air food market.',
   (SELECT id FROM categories WHERE slug = 'food-drink'), 'anywhere'),

  ('Brew your own beer from scratch',
   'Go through the full homebrewing process and bottle a batch you can share.',
   (SELECT id FROM categories WHERE slug = 'food-drink'), 'anywhere'),

  -- Arts & Culture
  ('Attend a live opera performance',
   'Watch a full production in a historic opera house.',
   (SELECT id FROM categories WHERE slug = 'arts-culture'), 'anywhere'),

  ('See the sunrise at Angkor Wat',
   'Watch the temple complex reflected in the moat as the sun rises behind its towers.',
   (SELECT id FROM categories WHERE slug = 'arts-culture'), 'Cambodia'),

  ('Visit the Louvre',
   'Spend a day exploring one of the world''s largest and most visited art museums.',
   (SELECT id FROM categories WHERE slug = 'arts-culture'), 'France'),

  ('Attend a traditional flamenco performance',
   'See live flamenco dance and guitar in an intimate tablao setting.',
   (SELECT id FROM categories WHERE slug = 'arts-culture'), 'Spain'),

  ('Watch a Broadway or West End show',
   'See a full-scale musical or play in one of the world''s great theater districts.',
   (SELECT id FROM categories WHERE slug = 'arts-culture'), 'anywhere'),

  -- Sports & Fitness
  ('Run a marathon',
   'Train for and complete the full 26.2 mile distance in an official race.',
   (SELECT id FROM categories WHERE slug = 'sports-fitness'), 'anywhere'),

  ('Complete a triathlon',
   'Swim, cycle, and run your way across the finish line of a triathlon event.',
   (SELECT id FROM categories WHERE slug = 'sports-fitness'), 'anywhere'),

  ('Climb a 14er',
   'Summit a mountain peak above 14,000 feet above sea level.',
   (SELECT id FROM categories WHERE slug = 'sports-fitness'), 'USA'),

  ('Surf a wave for the first time',
   'Take a lesson and stand up on a surfboard in the ocean.',
   (SELECT id FROM categories WHERE slug = 'sports-fitness'), 'anywhere'),

  ('Hike a famous long-distance trail',
   'Complete an iconic multi-day trail such as the Appalachian Trail, Camino de Santiago, or Milford Track.',
   (SELECT id FROM categories WHERE slug = 'sports-fitness'), 'anywhere'),

  -- Learning
  ('Reach conversational fluency in a new language',
   'Study and practice until you can hold a real conversation with a native speaker.',
   (SELECT id FROM categories WHERE slug = 'learning'), 'anywhere'),

  ('Learn to play a musical instrument',
   'Take lessons and practice until you can play a full song from memory.',
   (SELECT id FROM categories WHERE slug = 'learning'), 'anywhere'),

  ('Complete an online course or certification',
   'Finish a structured learning program and earn a credential in a new field.',
   (SELECT id FROM categories WHERE slug = 'learning'), 'anywhere'),

  ('Learn to code',
   'Build a working project in a programming language you''ve never used before.',
   (SELECT id FROM categories WHERE slug = 'learning'), 'anywhere'),

  ('Study abroad or take a language immersion trip',
   'Spend at least a month living and learning in a country where you don''t speak the native language.',
   (SELECT id FROM categories WHERE slug = 'learning'), 'anywhere'),

  -- Nature
  ('Camp under the stars far from city lights',
   'Spend a night in a remote spot with no light pollution and a full view of the Milky Way.',
   (SELECT id FROM categories WHERE slug = 'nature'), 'anywhere'),

  ('See a total solar eclipse',
   'Travel to the path of totality and watch day turn to night as the moon covers the sun.',
   (SELECT id FROM categories WHERE slug = 'nature'), 'anywhere'),

  ('Snorkel or dive the Great Barrier Reef',
   'Explore the world''s largest coral reef system and the marine life within it.',
   (SELECT id FROM categories WHERE slug = 'nature'), 'Australia'),

  ('Watch a volcanic eruption',
   'Witness active lava flows or an eruption from a safe observation point.',
   (SELECT id FROM categories WHERE slug = 'nature'), 'anywhere'),

  ('Go whale watching',
   'Spot whales breaching in the open ocean on a guided boat tour.',
   (SELECT id FROM categories WHERE slug = 'nature'), 'anywhere'),

  -- Social
  ('Volunteer abroad for at least a week',
   'Dedicate your time to a meaningful cause in another country.',
   (SELECT id FROM categories WHERE slug = 'social'), 'anywhere'),

  ('Host a dinner party for people you admire',
   'Cook a full meal from scratch and bring together friends, mentors, or inspiring strangers.',
   (SELECT id FROM categories WHERE slug = 'social'), 'anywhere'),

  ('Reconnect with a long-lost friend or family member',
   'Reach out to someone you''ve lost touch with and meet them in person.',
   (SELECT id FROM categories WHERE slug = 'social'), 'anywhere'),

  ('Attend a major international festival',
   'Experience a world-famous celebration like Carnival, Diwali, or Mardi Gras in its home city.',
   (SELECT id FROM categories WHERE slug = 'social'), 'anywhere'),

  ('Pay it forward in a meaningful way',
   'Do something unexpectedly generous for a stranger and ask nothing in return.',
   (SELECT id FROM categories WHERE slug = 'social'), 'anywhere'),

  -- Wellness
  ('Complete a digital detox of at least a week',
   'Disconnect from all screens and social media for seven or more consecutive days.',
   (SELECT id FROM categories WHERE slug = 'wellness'), 'anywhere'),

  ('Try a silent meditation retreat',
   'Spend several days in structured silence, meditation, and mindfulness practice.',
   (SELECT id FROM categories WHERE slug = 'wellness'), 'anywhere'),

  ('Train for and complete a physical challenge',
   'Pick a goal that scares you — a tough mudder, a century ride, a swim — and finish it.',
   (SELECT id FROM categories WHERE slug = 'wellness'), 'anywhere'),

  ('Sleep under the stars for a full night',
   'Spend a night outside with no tent, just a sleeping bag and the open sky.',
   (SELECT id FROM categories WHERE slug = 'wellness'), 'anywhere'),

  ('Take a solo trip',
   'Plan and take a trip entirely by yourself to a place you''ve never been.',
   (SELECT id FROM categories WHERE slug = 'wellness'), 'anywhere'),

  -- Career
  ('Start your own business',
   'Launch a product or service that solves a real problem and find your first paying customer.',
   (SELECT id FROM categories WHERE slug = 'career'), 'anywhere'),

  ('Give a talk in front of a large audience',
   'Present at a conference, TEDx event, or large public gathering.',
   (SELECT id FROM categories WHERE slug = 'career'), 'anywhere'),

  ('Get published',
   'Write something — an article, a short story, a book — and get it published.',
   (SELECT id FROM categories WHERE slug = 'career'), 'anywhere'),

  ('Mentor someone in your field',
   'Commit to regularly supporting a junior person working toward where you once were.',
   (SELECT id FROM categories WHERE slug = 'career'), 'anywhere'),

  ('Take a sabbatical',
   'Step away from your usual work for at least a month to rest, create, or explore.',
   (SELECT id FROM categories WHERE slug = 'career'), 'anywhere');
