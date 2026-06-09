INSERT INTO APP_USER(user_id, username, password, is_admin)
VALUES  (1, 'Evrim', 'SoccerCar@2358', TRUE),
        (2, 'Hakan', 'Psswd&&3457', FALSE),
        (3, 'Leyla', '478018476@', FALSE),
        (4, 'Rodrigo', 'RocketLeagueNo1Fan', FALSE),
        (5, 'Ted', 'Password123', FALSE);

INSERT INTO PLAYER(player_id, player_name, platform)
VALUES  (1, 'stizzy', 'Steam'),
        (2, 'ApparentlyJack','Steam'),
        (3, 'Joreuz', 'Steam'),
        (4, 'Fever', 'Epic Games'),
        (5, 'Torsos', 'Epic Games'),
        (6, 'bananahead', 'Epic Games'),
        (7, 'Atomic', 'Steam'),
        (8, 'Daniel', 'Steam'),
        (9, 'BeastMode', 'Steam'),
        (10, 'M0nkey M00n', 'Steam'),
        (11, 'dralii', 'Steam'),
        (12, 'ExoTiiK', 'Steam'),
        (13, 'Alpha54', 'Nintendo Switch'),
        (14, 'Radosin', 'Nintendo Switch'),
        (15, 'zen', 'Nintendo Switch'),
        (16, 'AcroniK', 'PlayStation'),
        (17, 'Oski', 'PlayStation'),
        (18, 'Atow.', 'PlayStation'),
        (19, 'Firstkiller', 'Xbox'),
        (20, 'Sypical', 'Xbox'),
        (21, 'mist', 'Xbox'),
        (22, 'DRUFINHO', 'Xbox'),
        (23, 'droppz', 'Xbox'),
        (24, 'brad', 'Xbox');

INSERT INTO TEAM(team_id, team_name, region)
VALUES  (1, 'Dignitas', 'Europe'),
        (2, 'Wildcard', 'Australia'),
        (3, 'Team BDS', 'Europe'),
        (4, 'G2 Stride', 'North America'),
        (5, 'KRÜ Esports', 'South America'),
        (6, 'G2 Esports', 'North America'),
        (7, 'Twisted Minds', 'Europe'),
        (8, 'Karmine Corp', 'Europe');  

INSERT INTO TOURNAMENT(tournament_id, tournament_name, country, start_date, end_date)
VALUES  (1, 'RLCS 2025 - World Championship', 'France', '2025-09-10', '2025-09-14'),
        (2, 'RLCS 2024 - World Championship', 'USA', '2024-09-10', '2024-09-15'),
        (3, 'RLCS 2022-23 - World Championship', 'Germany', '2023-08-03', '2023-08-13');

INSERT INTO ARENA(arena_id, arena_name)
VALUES  (1, 'LDLC Arena'),
        (2, 'Fort Worth'),
        (3, 'PSD Bank Dome'),
        (4, 'Paris La Défense Arena'),
        (5, 'Lenovo Center');

INSERT INTO MATCH_DATA(match_id, match_date, tournament_stage, weather, tournament_id, arena_id)
VALUES  (1, '2025-09-10', 'Round 1', 'Rainy', 1, 2),
        (2, '2024-09-11', 'Round 1', 'Sunny', 2, 3),
        (3, '2025-09-11', 'Round 1', 'Rainy', 1, 3),
        (4, '2025-09-12', 'Round 2', 'Foggy', 1, 1),
        (5, '2024-09-12', 'Round 2', 'Foggy', 2, 2),
        (6, '2023-08-03', 'Round 2', 'Stormy', 3, 5),
        (7, '2023-08-03', 'Round 3', 'Sunny', 3, 2),
        (8, '2025-09-12', 'Round 3', 'Sunny', 1, 5),
        (9, '2025-09-12', 'Round 3', 'Rainy', 1, 4),
        (10, '2025-09-13', 'Lower Bracket Quarterfinals', 'Rainy', 1, 2),
        (11, '2024-09-13', 'Lower Bracket Quarterfinals', 'Sunny', 2, 4),
        (12, '2024-09-13', 'Lower Bracket Quarterfinals', 'Foggy', 2, 3),
        (13, '2024-09-13', 'Upper Bracket Quarterfinals', 'Rainy', 2, 3),
        (14, '2023-08-07', 'Upper Bracket Quarterfinals', 'Foggy', 3, 1),
        (15, '2023-08-07', 'Upper Bracket Quarterfinals', 'Sunny', 3, 1),
        (16, '2025-09-14', 'Semifinals', 'Sunny', 1, 2),
        (17, '2025-09-14', 'Semifinals', 'Foggy', 1, 5),
        (18, '2024-09-14', 'Semifinals', 'Stormy', 2, 3),
        (19, '2024-09-15', 'Grand Final', 'Foggy', 2, 4),
        (20, '2025-09-14', 'Grand Final', 'Sunny', 1, 5);      

INSERT INTO PLAYER_MATCH_STATS(player_id, match_id, goals, assists, saves, shot_accuracy, mvp)
VALUES  --First Match
        (1,1,2,1,3,66.67,FALSE),
        (2,1,1,2,2,50.00,FALSE),
        (3,1,0,1,4,40.00,FALSE),
        (4,1,3,0,2,75.00,TRUE),
        (5,1,1,1,3,60.00,FALSE),
        (6,1,0,2,1,33.33,FALSE),

        --Second Match
        (7,2,2,1,2,70.00,FALSE),
        (8,2,1,2,4,55.00,FALSE),
        (9,2,3,1,3,80.00,TRUE),
        (10,2,1,0,2,45.00,FALSE),
        (11,2,0,1,3,30.00,FALSE),
        (12,2,1,1,1,50.00,FALSE),

        --Third Match
        (13,3,2,2,1,72.50,TRUE),
        (14,3,1,1,4,55.00,FALSE),
        (15,3,2,0,2,68.00,FALSE),
        (16,3,1,1,3,50.00,FALSE),
        (17,3,0,2,2,35.00,FALSE),
        (18,3,1,0,1,40.00,FALSE),

        --Fourth Match
        (19,4,3,1,2,78.00,TRUE),
        (20,4,1,2,1,60.00,FALSE),
        (21,4,0,1,4,42.00,FALSE),
        (22,4,2,0,2,70.00,FALSE),
        (23,4,1,1,3,50.00,FALSE),
        (24,4,0,2,1,33.00,FALSE),

        --Fifth Match
        (1,5,1,2,2,60.00,FALSE),
        (2,5,2,1,1,75.00,TRUE),
        (3,5,0,1,4,40.00,FALSE),
        (7,5,1,1,3,50.00,FALSE),
        (8,5,1,0,2,45.00,FALSE),
        (9,5,2,2,1,66.00,FALSE),

        --Sixth Match
        (10,6,3,0,2,82.00,TRUE),
        (11,6,1,2,1,55.00,FALSE),
        (12,6,0,1,4,35.00,FALSE),
        (13,6,2,1,2,70.00,FALSE),
        (14,6,1,0,3,48.00,FALSE),
        (15,6,0,2,2,40.00,FALSE),

        --Seventh Match
        (16,7,2,1,2,71.00,FALSE),
        (17,7,0,2,3,38.00,FALSE),
        (18,7,1,1,1,60.00,FALSE),
        (19,7,3,1,2,80.00,TRUE),
        (20,7,1,0,4,45.00,FALSE),
        (21,7,0,1,3,33.00,FALSE),

        --Eighth Match
        (22,8,2,0,2,75.00,TRUE),
        (23,8,1,1,1,58.00,FALSE),
        (24,8,0,2,4,40.00,FALSE),
        (1,8,2,1,2,68.00,FALSE),
        (2,8,1,1,3,50.00,FALSE),
        (3,8,0,0,2,25.00,FALSE),

        --Ninth Match
        (4,9,3,1,2,79.00,TRUE),
        (5,9,1,2,1,55.00,FALSE),
        (6,9,0,1,4,35.00,FALSE),
        (7,9,2,1,2,65.00,FALSE),
        (8,9,1,0,3,48.00,FALSE),
        (9,9,0,2,2,40.00,FALSE),

        --Tenth Match
        (10,10,2,1,2,73.00,FALSE),
        (11,10,1,1,3,52.00,FALSE),
        (12,10,3,0,1,81.00,TRUE),
        (13,10,1,2,2,58.00,FALSE),
        (14,10,0,1,4,30.00,FALSE),
        (15,10,1,0,2,45.00,FALSE),

        --Eleventh Match
        (16,11,2,1,2,72.00,FALSE),
        (17,11,1,2,3,55.00,FALSE),
        (18,11,0,1,4,35.00,FALSE),
        (19,11,3,1,1,82.00,TRUE),
        (20,11,1,0,2,48.00,FALSE),
        (21,11,0,2,3,40.00,FALSE),

        --Twelfth Match
        (22,12,1,1,2,60.00,FALSE),
        (23,12,2,1,1,75.00,TRUE),
        (24,12,0,2,3,38.00,FALSE),
        (1,12,1,1,2,55.00,FALSE),
        (2,12,1,0,4,45.00,FALSE),
        (3,12,0,1,2,30.00,FALSE),

        --Thirteenth Match
        (4,13,2,2,1,78.00,TRUE),
        (5,13,1,1,3,52.00,FALSE),
        (6,13,0,1,2,35.00,FALSE),
        (7,13,2,0,2,68.00,FALSE),
        (8,13,1,2,1,58.00,FALSE),
        (9,13,0,1,4,32.00,FALSE),

        --Fourteenth Match
        (10,14,3,0,2,84.00,TRUE),
        (11,14,1,2,1,55.00,FALSE),
        (12,14,0,1,3,40.00,FALSE),
        (13,14,2,1,2,70.00,FALSE),
        (14,14,1,0,4,45.00,FALSE),
        (15,14,0,2,2,38.00,FALSE),

        -- Fifteenth Match
        (16,15,1,2,2,63.00,FALSE),
        (17,15,0,1,4,34.00,FALSE),
        (18,15,2,1,1,76.00,TRUE),
        (19,15,1,1,2,55.00,FALSE),
        (20,15,1,0,3,47.00,FALSE),
        (21,15,0,2,2,36.00,FALSE),

        --Sixteenth Match
        (22,16,3,1,1,81.00,TRUE),
        (23,16,1,2,2,60.00,FALSE),
        (24,16,0,1,4,33.00,FALSE),
        (1,16,2,0,2,68.00,FALSE),
        (2,16,1,1,3,50.00,FALSE),
        (3,16,0,2,1,42.00,FALSE),

        --Seventeenth Match
        (4,17,2,1,2,72.00,FALSE),
        (5,17,1,2,1,58.00,FALSE),
        (6,17,3,0,2,80.00,TRUE),
        (7,17,1,1,3,50.00,FALSE),
        (8,17,0,2,2,36.00,FALSE),
        (9,17,1,0,4,45.00,FALSE),

        --Eighteenth Match
        (10,18,2,1,1,74.00,FALSE),
        (11,18,1,2,3,55.00,FALSE),
        (12,18,3,0,2,83.00,TRUE),
        (13,18,1,1,2,60.00,FALSE),
        (14,18,0,2,4,35.00,FALSE),
        (15,18,1,0,1,48.00,FALSE),

        --Nineteenth Match
        (16,19,2,1,2,71.00,FALSE),
        (17,19,1,2,1,57.00,FALSE),
        (18,19,0,1,4,32.00,FALSE),
        (19,19,3,0,2,85.00,TRUE),
        (20,19,1,1,3,52.00,FALSE),
        (21,19,0,2,2,40.00,FALSE),

        --Twentieth Match
        (22,20,2,1,1,77.00,FALSE),
        (23,20,1,2,2,59.00,FALSE),
        (24,20,0,1,4,35.00,FALSE),
        (1,20,3,0,2,86.00,TRUE),
        (2,20,1,1,3,55.00,FALSE),
        (3,20,1,2,1,62.00,FALSE);

INSERT INTO PLAYS_FOR (player_id, team_id, since, until)
VALUES  -- Dignitas
        (1, 1, '2024-04-19', '2025-12-10'),
        (2, 1, '2020-11-01', '2025-11-01'),
        (3, 1, '2024-01-01', NULL),

        -- Wildcard
        (4, 2, '2023-03-01', NULL),
        (5, 2, '2022-01-16', '2025-12-12'),
        (6, 2, '2020-04-17', NULL),

        -- Team BDS
        (7, 3, '2019-01-01', '2025-12-11'),
        (8, 3, '2020-12-07', NULL),
        (9, 3, '2022-02-10', NULL),

        -- G2 Stride
        (10, 4, '2022-07-14', '2025-12-18'),
        (11, 4, '2021-10-20', '2025-10-07'),
        (12, 4, '2021-11-21', NULL),

        -- KRÜ Esports
        (13, 5, '2018-08-08', NULL),
        (14, 5, '2020-07-06', NULL),
        (15, 5, '2020-10-15', NULL),

        -- G2 Esports
        (16, 6, '2017-04-17', NULL),
        (17, 6, '2016-03-03', NULL),
        (18, 6, '2020-10-01', '2025-12-18'),

        -- Twisted Minds
        (19, 7, '2015-02-14', NULL),
        (20, 7, '2015-06-30', '2026-11-07'),
        (21, 7, '2022-02-27', NULL),

        -- Karmine Corp
        (22, 8, '2022-10-30', '2026-12-07'),
        (23, 8, '2021-07-10', '2025-08-05'),
        (24, 8, '2020-08-18', '2025-11-10');

INSERT INTO PLAYS_AS (team_id, match_id, team_type)
VALUES -- Match 1: Dignitas vs Wildcard
        (1, 1, 'BLUE'),
        (2, 1, 'ORANGE'),

        -- Match 2: Team BDS vs G2 Stride
        (3, 2, 'BLUE'),
        (4, 2, 'ORANGE'),

        -- Match 3: KRÜ Esports vs G2 Esports
        (5, 3, 'BLUE'),
        (6, 3, 'ORANGE'),

        -- Match 4: Twisted Minds vs Karmine Corp
        (7, 4, 'BLUE'),
        (8, 4, 'ORANGE'),

        -- Match 5: Dignitas vs Team BDS
        (1, 5, 'BLUE'),
        (3, 5, 'ORANGE'),

        -- Match 6: G2 Stride vs KRÜ Esports
        (4, 6, 'BLUE'),
        (5, 6, 'ORANGE'),

        -- Match 7: G2 Esports vs Twisted Minds
        (6, 7, 'BLUE'),
        (7, 7, 'ORANGE'),

        -- Match 8: Karmine Corp vs Dignitas
        (8, 8, 'BLUE'),
        (1, 8, 'ORANGE'),

        -- Match 9: Wildcard vs Team BDS
        (2, 9, 'BLUE'),
        (3, 9, 'ORANGE'),

        -- Match 10: G2 Stride vs KRÜ Esports
        (4, 10, 'BLUE'),
        (5, 10, 'ORANGE'),

        -- Match 11: G2 Esports vs Twisted Minds
        (6, 11, 'BLUE'),
        (7, 11, 'ORANGE'),

        -- Match 12: Karmine Corp vs Dignitas
        (8, 12, 'BLUE'),
        (1, 12, 'ORANGE'),

        -- Match 13: Wildcard vs Team BDS
        (2, 13, 'BLUE'),
        (3, 13, 'ORANGE'),

        -- Match 14: G2 Stride vs KRÜ Esports
        (4, 14, 'BLUE'),
        (5, 14, 'ORANGE'),

        -- Match 15: G2 Esports vs Twisted Minds
        (6, 15, 'BLUE'),
        (7, 15, 'ORANGE'),

        -- Match 16: Karmine Corp vs Dignitas
        (8, 16, 'BLUE'),
        (1, 16, 'ORANGE'),

        -- Match 17: Wildcard vs Team BDS
        (2, 17, 'BLUE'),
        (3, 17, 'ORANGE'),

        -- Match 18: G2 Stride vs KRÜ Esports
        (4, 18, 'BLUE'),
        (5, 18, 'ORANGE'),

        -- Match 19: G2 Esports vs Twisted Minds
        (6, 19, 'BLUE'),
        (7, 19, 'ORANGE'),

        -- Match 20: Karmine Corp vs Dignitas
        (8, 20, 'BLUE'),
        (1, 20, 'ORANGE');

INSERT INTO FAV_PLAYER (user_id, player_id)
VALUES  (1,17),
        (2,21),
        (3,9),
        (4,8),
        (5,10);

INSERT INTO FAV_TEAM (user_id, team_id)
VALUES  (1,6),
        (2,7),
        (3,3),
        (4,3),
        (5,4);
