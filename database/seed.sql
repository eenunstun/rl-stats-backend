INSERT INTO APP_USER(user_id, username, password, is_admin)
SELECT
    user_id,
    username,
    password,
    is_admin
FROM (
    VALUES
        (1, 'Evrim', 'SoccerCar@2358', TRUE),
        (2, 'Hakan', 'Psswd&&3457', FALSE),
        (3, 'Leyla', '478018476@', FALSE),
        (4, 'Rodrigo', 'RocketLeagueNo1', FALSE),
        (5, 'Ted', 'Password123', FALSE),
        (6, 'Mina', 'BoostQueen42', FALSE),
        (7, 'Arda', 'OctaneMain77', FALSE),
        (8, 'Selin', 'CeilingShot88', FALSE),
        (9, 'Jonas', 'FlipReset90', FALSE),
        (10, 'Nora', 'WaveDash55', FALSE),
        (11, 'Emre', 'DemoChaser11', FALSE),
        (12, 'Aylin', 'Supersonic12', FALSE),
        (13, 'Carlos', 'RocketPass13', FALSE),
        (14, 'Irem', 'GoalLine14', FALSE),
        (15, 'Deniz', 'AirRoll15', FALSE),
        (16, 'Sofia', 'Backboard16', FALSE),
        (17, 'Mert', 'HalfFlip17', FALSE),
        (18, 'Lina', 'BoostPad18', FALSE),
        (19, 'Kerem', 'DoubleTap19', FALSE),
        (20, 'Ece', 'Overtime20', FALSE)
) AS users(user_id, username, password, is_admin);

INSERT INTO PLAYER(player_id, player_name, platform)
SELECT
    ((batch - 1) * 24) + base_id AS player_id,
    CASE
        WHEN batch = 1 THEN base_name
        ELSE base_name || ' ' || batch
    END AS player_name,
    CASE ((base_id + batch) % 5)
        WHEN 0 THEN 'Steam'
        WHEN 1 THEN 'Epic Games'
        WHEN 2 THEN 'PlayStation'
        WHEN 3 THEN 'Xbox'
        ELSE 'Nintendo Switch'
    END AS platform
FROM generate_series(1, 4) AS batch
CROSS JOIN (
    VALUES
        (1, 'stizzy'),
        (2, 'ApparentlyJack'),
        (3, 'Joreuz'),
        (4, 'Fever'),
        (5, 'Torsos'),
        (6, 'bananahead'),
        (7, 'Atomic'),
        (8, 'Daniel'),
        (9, 'BeastMode'),
        (10, 'M0nkey M00n'),
        (11, 'dralii'),
        (12, 'ExoTiiK'),
        (13, 'Alpha54'),
        (14, 'Radosin'),
        (15, 'zen'),
        (16, 'AcroniK'),
        (17, 'Oski'),
        (18, 'Atow.'),
        (19, 'Firstkiller'),
        (20, 'Sypical'),
        (21, 'mist'),
        (22, 'DRUFINHO'),
        (23, 'droppz'),
        (24, 'brad')
) AS players(base_id, base_name)
ORDER BY player_id;

INSERT INTO TEAM(team_id, team_name, region)
SELECT
    ((batch - 1) * 8) + base_id AS team_id,
    CASE
        WHEN batch = 1 THEN base_name
        ELSE base_name || ' ' || batch
    END AS team_name,
    CASE ((base_id + batch) % 8)
        WHEN 0 THEN 'Europe'
        WHEN 1 THEN 'Asia'
        WHEN 2 THEN 'North America'
        WHEN 3 THEN 'South America'
        WHEN 4 THEN 'Middle East'
        WHEN 5 THEN 'South East'
        WHEN 6 THEN 'Oceania'
        ELSE 'Europe'
    END AS region
FROM generate_series(1, 4) AS batch
CROSS JOIN (
    VALUES
        (1, 'Dignitas'),
        (2, 'Wildcard'),
        (3, 'Team BDS'),
        (4, 'G2 Stride'),
        (5, 'KRU Esports'),
        (6, 'G2 Esports'),
        (7, 'Twisted Minds'),
        (8, 'Karmine Corp')
) AS teams(base_id, base_name)
ORDER BY team_id;

INSERT INTO TOURNAMENT(tournament_id, tournament_name, country, start_date, end_date)
SELECT
    tournament_id,
    tournament_name,
    country,
    start_date::date,
    end_date::date
FROM (
    VALUES
        (1, 'RLCS 2025 - World Championship', 'France', '2025-09-10', '2025-09-14'),
        (2, 'RLCS 2024 - World Championship', 'USA', '2024-09-10', '2024-09-15'),
        (3, 'RLCS 2022-23 - World Championship', 'Germany', '2023-08-03', '2023-08-13'),
        (4, 'RLCS 2026 - Spring Major', 'United Kingdom', '2026-05-20', '2026-05-24'),
        (5, 'RLCS 2026 - Winter Major', 'Netherlands', '2026-02-18', '2026-02-22'),
        (6, 'RLCS 2026 - Fall Major', 'Canada', '2026-11-04', '2026-11-08'),
        (7, 'Rocket Masters Istanbul', 'Turkey', '2025-03-12', '2025-03-16'),
        (8, 'Pacific Boost Invitational', 'Japan', '2025-06-18', '2025-06-22'),
        (9, 'Americas Championship', 'Brazil', '2024-05-08', '2024-05-12'),
        (10, 'European Open Finals', 'Spain', '2024-11-13', '2024-11-17'),
        (11, 'Oceania Super Series', 'Australia', '2023-04-19', '2023-04-23'),
        (12, 'MENA Champions Cup', 'Saudi Arabia', '2025-12-03', '2025-12-07')
) AS tournaments(tournament_id, tournament_name, country, start_date, end_date);

INSERT INTO ARENA(arena_id, arena_name)
VALUES
    (1, 'DFH Stadium'),
    (2, 'Mannfield'),
    (3, 'Champions Field'),
    (4, 'Urban Central'),
    (5, 'Beckwith Park'),
    (6, 'Utopia Coliseum'),
    (7, 'Wasteland'),
    (8, 'Neo Tokyo'),
    (9, 'AquaDome'),
    (10, 'Farmstead'),
    (11, 'Forbidden Temple'),
    (12, 'Deadeye Canyon'),
    (13, 'Neon Fields'),
    (14, 'Salty Shores'),
    (15, 'Sovereign Heights'),
    (16, 'Starbase ARC'),
    (17, 'Rivals Arena'),
    (18, 'Estadio Vida'),
    (19, 'Drift Woods'),
    (20, 'Futura Garden'),
    (21, 'Boostfield Mall'),
    (22, 'Parc de Paris');

INSERT INTO MATCH_DATA(match_id, match_date, tournament_stage, weather, tournament_id, arena_id)
SELECT
    match_id,
    (DATE '2023-08-01' + ((match_id - 1) * INTERVAL '11 days'))::date AS match_date,
    (ARRAY[
        'Group Stage',
        'Round of 32',
        'Round of 16',
        'Quarter-Finals',
        'Semi-Finals',
        'Grand Final'
    ])[((match_id - 1) % 6) + 1] AS tournament_stage,
    (ARRAY['Day', 'Night', 'Snowy', 'Stormy', 'Clear'])[((match_id - 1) % 5) + 1] AS weather,
    ((match_id - 1) % 12) + 1 AS tournament_id,
    ((match_id * 7) % 22) + 1 AS arena_id
FROM generate_series(1, 80) AS match_id;

INSERT INTO PLAYS_FOR (player_id, team_id, since, until)
SELECT
    ((team_id - 1) * 3) + slot AS player_id,
    team_id,
    (DATE '2020-01-01' + ((team_id + slot) * INTERVAL '19 days'))::date AS since,
    NULL::date AS until
FROM generate_series(1, 32) AS team_id
CROSS JOIN generate_series(1, 3) AS slot;

INSERT INTO PLAYS_AS (team_id, match_id, team_type)
SELECT ((match_id - 1) % 32) + 1 AS team_id, match_id, 'BLUE' AS team_type
FROM generate_series(1, 80) AS match_id
UNION ALL
SELECT ((match_id + 7) % 32) + 1 AS team_id, match_id, 'ORANGE' AS team_type
FROM generate_series(1, 80) AS match_id
ORDER BY match_id, team_type;

INSERT INTO PLAYER_MATCH_STATS(player_id, match_id, goals, assists, saves, shot_accuracy, mvp)
SELECT
    CASE
        WHEN roster_slot <= 3 THEN (((((match_id - 1) % 32) + 1) - 1) * 3) + roster_slot
        ELSE (((((match_id + 7) % 32) + 1) - 1) * 3) + (roster_slot - 3)
    END AS player_id,
    match_id,
    ((match_id + roster_slot) % 4) AS goals,
    ((match_id + roster_slot + 1) % 3) AS assists,
    ((match_id + roster_slot + 2) % 5) AS saves,
    (35 + ((match_id * 7 + roster_slot * 11) % 61))::numeric(5,2) AS shot_accuracy,
    roster_slot = ((match_id - 1) % 6) + 1 AS mvp
FROM generate_series(1, 80) AS match_id
CROSS JOIN generate_series(1, 6) AS roster_slot
ORDER BY match_id, roster_slot;

INSERT INTO FAV_PLAYER (user_id, player_id)
SELECT
    user_id,
    ((user_id * 7) % 96) + 1 AS player_id
FROM generate_series(1, 20) AS user_id;

INSERT INTO FAV_TEAM (user_id, team_id)
SELECT
    user_id,
    ((user_id * 3) % 32) + 1 AS team_id
FROM generate_series(1, 20) AS user_id;
