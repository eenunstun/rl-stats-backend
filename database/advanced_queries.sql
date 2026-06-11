-- name: top-scorers
-- Top 5 Scorers with at least 60% Average Shot Accuracy

SELECT  P.player_name,
        SUM(S.goals) AS goal_total, 
        SUM(S.assists) AS assist_total, 
        ROUND(AVG(S.shot_accuracy),2) AS average_shot_accuracy,             
        SUM(S.saves) AS saves_total
FROM    Player P, PLAYER_MATCH_STATS S
WHERE   P.player_id = S.player_id
GROUP BY P.player_id, P.player_name
HAVING  AVG(S.shot_accuracy) >= 60
ORDER BY goal_total DESC 
LIMIT 5;

-- name: top-teams-by-matches
-- Top 5 Teams with Most Matches Played

SELECT  T.team_name,
        COUNT(*) AS played_total
FROM    TEAM T, MATCH_DATA M, PLAYS_AS PA
WHERE   T.team_id = PA.team_id 
    AND PA.match_id = M.match_id
GROUP BY T.team_id, T.team_name
ORDER BY played_total DESC
LIMIT 5;

-- name: fav-teams-leaderboard
-- Top 3 Most Favourited Teams and Their Respective Goals

WITH team_goals AS (
    SELECT  T.team_id,
            T.team_name,
            SUM(PMS.goals) AS team_total_goal
    FROM    TEAM T, PLAYER_MATCH_STATS PMS, PLAYS_FOR PF 
    WHERE   T.team_id = PF.team_id
        AND PMS.player_id = PF.player_id
    GROUP BY T.team_id, T.team_name
),
favorite_counts AS (
    SELECT  FT.team_id,
            COUNT(DISTINCT FT.user_id) AS favorite_count
    FROM    FAV_TEAM FT
    GROUP BY FT.team_id
)
SELECT  TS.team_name,
        TS.team_total_goal,
        FC.favorite_count
FROM    team_goals TS,
        favorite_counts FC
WHERE   TS.team_id = FC.team_id
ORDER BY FC.favorite_count DESC
LIMIT 3;


-- name: rank-tournaments-by-goals
-- Top 5 Tournaments with Most Goals

SELECT
    T.tournament_id,
    T.tournament_name,
    SUM(PMS.goals) AS tournament_total_goals,
    RANK() OVER (
        ORDER BY SUM(PMS.goals) DESC
    ) AS goal_rank
FROM TOURNAMENT T
JOIN MATCH_DATA M
    ON T.tournament_id = M.tournament_id
JOIN PLAYER_MATCH_STATS PMS
    ON M.match_id = PMS.match_id
GROUP BY
    T.tournament_id,
    T.tournament_name
ORDER BY
    goal_rank,
    tournament_total_goals DESC
LIMIT 5;
    
-- name: match-scores
-- Final Scores of Matches using plays_for and match_data dates

SELECT  M.match_id,
        M.match_date,
        A.team_name AS blue_team,
        A.team_score AS blue_score,
        B.team_name AS orange_team,
        B.team_score AS orange_score
FROM    MATCH_DATA M,
(
    SELECT PA.match_id,
           T.team_name,
           SUM(PMS.goals) AS team_score
    FROM TEAM T,
         PLAYS_AS PA, 
         PLAYS_FOR PF, 
         PLAYER_MATCH_STATS PMS,
         MATCH_DATA M1
    WHERE T.team_id = PA.team_id
      AND T.team_id = PF.team_id
      AND PF.player_id = PMS.player_id
      AND PA.match_id = PMS.match_id
      AND M1.match_id = PA.match_id
      AND M1.match_id = PMS.match_id
      AND M1.match_date >= PF.since
      AND (PF.until IS NULL OR M1.match_date <= PF.until)
      AND PA.team_type = 'BLUE'
    GROUP BY PA.match_id, T.team_name
) AS A,
(
    SELECT PA.match_id,
           T.team_name,
           SUM(PMS.goals) AS team_score
    FROM TEAM T,
         PLAYS_AS PA, 
         PLAYS_FOR PF, 
         PLAYER_MATCH_STATS PMS,
         MATCH_DATA M1
    WHERE T.team_id = PA.team_id
      AND T.team_id = PF.team_id
      AND PF.player_id = PMS.player_id
      AND PA.match_id = PMS.match_id
      AND M1.match_id = PA.match_id
      AND M1.match_id = PMS.match_id
      AND M1.match_date >= PF.since
      AND (PF.until IS NULL OR M1.match_date <= PF.until)
      AND PA.team_type = 'ORANGE'
    GROUP BY PA.match_id, T.team_name
) AS B
WHERE A.match_id = B.match_id
  AND A.match_id = M.match_id
ORDER BY A.match_id;
