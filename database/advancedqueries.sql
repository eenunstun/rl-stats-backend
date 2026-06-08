--1 Match Results

--Top 5 Scorers with at least 60% Average Shot Accuracy

SELECT P.player_name, 
       SUM(S.goals) AS goal_total, 
       SUM(S.assists) AS assist_total, 
       ROUND(AVG(S.shot_accuracy),2) AS average_shot_accuracy, 
       SUM(S.saves) AS saves_total
FROM Player P, PLAYER_MATCH_STATS S
WHERE P.player_id = S.player_id
GROUP BY P.player_id, P.player_name
HAVING AVG(S.shot_accuracy) >= 60
ORDER BY goal_total DESC 
LIMIT 5;

--3 

--4

--5