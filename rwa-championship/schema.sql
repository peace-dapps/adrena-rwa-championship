-- ─────────────────────────────────────────────
-- ADRENA RWA CHAMPIONSHIP — SUPABASE SCHEMA
-- ─────────────────────────────────────────────

-- 1. SEASONS
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'upcoming', -- upcoming | active | completed
  created_at timestamptz default now()
);

-- 2. SESSIONS (weekly per league)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id),
  league text not null, -- equities | commodities | baskets
  week_number int not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'upcoming', -- upcoming | active | market_closed | completed
  created_at timestamptz default now()
);

-- 3. TRADERS
create table if not exists traders (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  display_name text,
  registered_at timestamptz default now(),
  total_rar_score numeric default 0,
  total_championship_points int default 0
);

-- 4. POSITIONS (synced from Adrena API)
create table if not exists positions (
  id text primary key, -- position_id from Adrena
  wallet_address text not null,
  symbol text not null,
  league text, -- equities | commodities | baskets | crypto
  side text not null, -- long | short
  status text not null, -- open | closed
  entry_price numeric,
  exit_price numeric,
  exit_price_normalized numeric, -- CAN-adjusted via Autonom
  entry_size numeric,
  collateral_amount numeric,
  pnl numeric,
  pnl_normalized numeric, -- using CAN-adjusted exit price
  entry_leverage numeric,
  entry_date timestamptz,
  exit_date timestamptz,
  fees numeric,
  market_open_at_close boolean, -- was market open when position closed?
  scored boolean default false,
  session_id uuid references sessions(id),
  created_at timestamptz default now()
);

-- 5. LEADERBOARD SCORES
create table if not exists leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  wallet_address text not null,
  league text not null,
  rar_score numeric default 0,
  total_pnl_normalized numeric default 0,
  total_collateral numeric default 0,
  trade_count int default 0,
  win_count int default 0,
  win_rate numeric default 0,
  consistency_multiplier numeric default 1.0,
  streak_bonus numeric default 1.0,
  rank int,
  championship_points int default 0,
  updated_at timestamptz default now(),
  unique(session_id, wallet_address, league)
);

-- 6. SEASON LEADERBOARD (aggregate)
create table if not exists season_leaderboard (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id),
  wallet_address text not null,
  league text not null,
  total_rar_score numeric default 0,
  total_championship_points int default 0,
  best_weekly_rank int,
  sessions_participated int default 0,
  rank int,
  updated_at timestamptz default now(),
  unique(season_id, wallet_address, league)
);

-- 7. RAFFLE ENTRIES
create table if not exists raffle_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  wallet_address text not null,
  entries int not null default 0, -- 1 entry per $25 fees paid
  total_fees_paid numeric default 0,
  created_at timestamptz default now(),
  unique(session_id, wallet_address)
);

-- 8. RAFFLE RESULTS
create table if not exists raffle_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  winner_wallet text not null,
  prize_adx int not null,
  qrng_proof text, -- Autonom QRNG Merkle proof (JSON)
  qrng_root text,  -- on-chain committed root
  drawn_at timestamptz default now()
);

-- 9. ACHIEVEMENTS
create table if not exists trader_achievements (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  achievement_key text not null, -- equity_analyst | commodity_trader | basket_weaver | rwa_leviathan
  achievement_name text not null,
  unlocked_at timestamptz default now(),
  unique(wallet_address, achievement_key)
);

-- 10. STREAKS
create table if not exists trader_streaks (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  league text not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_qualifying_session uuid references sessions(id),
  updated_at timestamptz default now(),
  unique(wallet_address, league)
);

-- ─── INDEXES ─────────────────────────────────
create index if not exists idx_positions_wallet on positions(wallet_address);
create index if not exists idx_positions_session on positions(session_id);
create index if not exists idx_positions_scored on positions(scored);
create index if not exists idx_positions_exit_date on positions(exit_date);
create index if not exists idx_leaderboard_session on leaderboard_scores(session_id);
create index if not exists idx_leaderboard_league on leaderboard_scores(league);
create index if not exists idx_raffle_session on raffle_entries(session_id);

-- ─── REALTIME ────────────────────────────────
alter publication supabase_realtime add table leaderboard_scores;
alter publication supabase_realtime add table sessions;

-- ─── SEED: SEASON 1 ──────────────────────────
insert into seasons (id, name, start_date, end_date, status) values
  ('00000000-0000-0000-0000-000000000001', 'RWA Championship Season 1', '2026-03-17 00:00:00+00', '2026-04-14 00:00:00+00', 'active')
on conflict do nothing;

-- Week 1 sessions
insert into sessions (season_id, league, week_number, start_time, end_time, status) values
  ('00000000-0000-0000-0000-000000000001', 'equities',    1, '2026-03-17 13:30:00+00', '2026-03-21 20:00:00+00', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'commodities', 1, '2026-03-17 13:30:00+00', '2026-03-21 20:00:00+00', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'baskets',     1, '2026-03-17 13:30:00+00', '2026-03-28 20:00:00+00', 'active')
on conflict do nothing;
