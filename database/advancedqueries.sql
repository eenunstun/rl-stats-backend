--Top 5 Scorers with at least 60% Average Shot Accuracy

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

--Top 5 Teams wth Most Matches Played

SELECT  T.team_name, 
        COUNT(*) AS played_total
FROM    TEAM T, MATCH_DATA M, PLAYS_AS PA
WHERE   T.team_id = PA.team_id 
    AND PA.match_id = M.match_id
GROUP BY T.team_id, T.team_name
ORDER BY played_total DESC
LIMIT 5;

--Top 3 Favorite Teams Ranked by Number of Total Goals Scored

SELECT  T.team_name,
        SUM(PMS.goals) AS team_total_goal,
        SUM(PMS.assists) AS team_total_assists,
        SUM(PMS.saves) AS team_total_saves,
        ROUND(AVG(PMS.shot_accuracy),2) AS team_average_shot_accuracy
FROM    TEAM T, PLAYER_MATCH_STATS PMS, PLAYS_FOR PF 
WHERE   T.team_id = PF.team_id
    AND PMS.player_id = PF.player_id
    AND T.team_id IN (
        SELECT FT.team_id
        FROM FAV_TEAM FT
    )
GROUP BY T.team_id, T.team_name
ORDER BY team_total_goal DESC
LIMIT 3;


--Statistics of the Tournament with Most Goals

SELECT  T.tournament_name, 
        SUM(PMS.goals) AS tournament_total_goal, 
        SUM(PMS.assists) AS tournament_total_assist, 
        SUM(PMS.saves) AS tournament_total_save
FROM    TOURNAMENT T,
        MATCH_DATA M,
        PLAYER_MATCH_STATS PMS
WHERE   M.match_id = PMS.match_id
    AND T.tournament_id = M.tournament_id
GROUP BY T.tournament_id, T.tournament_name
HAVING  SUM(PMS.goals) = (
        SELECT MAX(tournament_total_goals)
        FROM (
             SELECT SUM(PMS1.goals) AS tournament_total_goals
             FROM TOURNAMENT T1,
                  MATCH_DATA M1,
                  PLAYER_MATCH_STATS PMS1
             WHERE M1.match_id = PMS1.match_id
             AND T1.tournament_id= M1.tournament_id
             GROUP BY T1.tournament_id
             ) AS tournament_goals_total
);

--Final Scores of Matches

SELECT  A.match_id,
        A.match_date,
        A.team_name AS blue_team,
        A.team_score AS blue_score,
        B.team_name AS orange_team,
        B.team_score AS orange_score
FROM
(
    SELECT PA.match_id,
           T.team_name,
           SUM(PMS.goals) AS team_score
    FROM TEAM T,
         PLAYS_AS PA, 
         PLAYS_FOR PF, 
         PLAYER_MATCH_STATS PMS
    WHERE T.team_id = PA.team_id
      AND T.team_id = PF.team_id
      AND PF.player_id = PMS.player_id
      AND PA.match_id = PMS.match_id
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
         PLAYER_MATCH_STATS PMS
    WHERE T.team_id = PA.team_id
      AND T.team_id = PF.team_id
      AND PF.player_id = PMS.player_id
      AND PA.match_id = PMS.match_id
      AND PA.team_type = 'ORANGE'
    GROUP BY PA.match_id, T.team_name
) AS B,
MATCH_DATA M
WHERE A.match_id = B.match_id
  AND A.match_id = M.match_id
ORDER BY A.match_id;