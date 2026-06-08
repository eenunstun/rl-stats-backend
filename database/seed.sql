INSERT INTO APP_USER(user_id, username, password, is_admin)
VALUES(1, 'Evrim', 'SoccerCar@2358', TRUE),
      (2, 'Hakan', 'Psswd&&3457', FALSE),
      (3, 'Leyla', '478018476@', FALSE),
      (4, 'Rodrigo', 'RocketLeagueNo1Fan', FALSE),
      (5, 'Ted', 'Password123', FALSE);

INSERT INTO PLAYER(player_id, player_name, platform)
VALUES(1, 'stizzy', 'PC'),
      (2, 'ApparentlyJack','PC'),
      (3, 'Joreuz', 'PC'),
      (4, 'Fever', 'PC'),
      (5, 'Torsos', 'PC'),
      (6, 'bananahead', 'PC'),
      (7, 'Atomic', 'PS'),
      (8, 'Daniel', 'PS'),
      (9, 'BeastMode', 'PS'),
      (10, 'M0nkey M00n', 'PS'),
      (11, 'dralii', 'PS'),
      (12, 'ExoTiiK', 'PS'),
      (13, 'Alpha54', 'PS'),
      (14, 'Radosin', 'PS'),
      (15, 'zen', 'PS'),
      (16, 'AcroniK', 'PS'),
      (17, 'Oski', 'PS'),
      (18, 'Atow.', 'PS'),
      (19, 'Firstkiller', 'XBOX'),
      (20, 'Sypical', 'XBOX'),
      (21, 'mist', 'XBOX');
      (22, 'DRUFINHO', 'XBOX'),
      (23, 'droppz', 'XBOX'),
      (24, 'brad', 'XBOX');

INSERT INTO TEAM(team_id, team_name, region)
VALUES(1, 'Dignitas', 'Europe'),
      (2, 'Wildcard', 'Australia'),
      (3, 'Team BDS', 'Europe'),
      (4, 'G2 Stride', 'North America'),
      (5, 'KRÜ Esports', 'South America'),
      (6, 'G2 Esports', 'North America'),
      (7, 'Twisted Minds', 'Europe'),
      (8, 'Karmine Corp', 'Europe');  

INSERT INTO TOURNAMENT(tournament_id, tournament_name, country, start_date, end_date)
VALUES(1, 'RLCS 2025 - World Championship', 'France', '2025-09-10', '2025-09-14'),
      (2, 'RLCS 2024 - World Championship', 'USA', '2024-09-10', '2024-09-15'),
      (3, 'RLCS 2022-23 - World Championship', 'Germany', '2023-08-03', '2023-08-13');

INSERT INTO ARENA(arena_id, arena_name)
VALUES(1, 'LDLC Arena'),
      (2, 'Fort Worth'),
      (3, 'PSD Bank Dome'),
      (4, 'Paris La Défense Arena'),
      (5, 'Lenovo Center');

INSERT INTO MATCH_DATA(match_id, match_date, tournament_stage, weather, tournament_id, arena_id)
VALUES(1, '2025-09-10', 'Round 1', 'Rainy', 1, 2),
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

INSERT INTO PLAYER_MATCH_STATS()
VALUES(),

