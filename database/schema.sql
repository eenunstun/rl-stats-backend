drop table if exists APP_USER cascade;
drop table if exists PLAYER cascade;
drop table if exists TEAM cascade;
drop table if exists TOURNAMENT cascade;
drop table if exists ARENA cascade;
drop table if exists MATCH_DATA cascade;
drop table if exists PLAYER_MATCH_STATS cascade;
drop table if exists PLAYS_FOR cascade;
drop table if exists PLAYS_AS cascade;
drop table if exists FAV_PLAYER cascade;
drop table if exists FAV_TEAM cascade;

CREATE TABLE APP_USER	
(
user_id INT primary key,
username VARCHAR(20) not null unique,
password VARCHAR(50) not null,
is_admin BOOLEAN not null default false 
);
CREATE TABLE PLAYER	
(
player_id INT primary key,
player_name VARCHAR(50) not null,
platform VARCHAR(50) not null
);

CREATE table TEAM
(
team_id INT primary key,
team_name VARCHAR(30) not null unique,
region VARCHAR(20) not null
);

CREATE TABLE TOURNAMENT	
(
tournament_id INT primary key,
tournament_name VARCHAR(30) not null,
country VARCHAR(30) not null,
start_date DATE not null,
end_date DATE not null,
check (end_date >= start_date)
);

CREATE TABLE ARENA
(
arena_id INT primary key,
arena_name VARCHAR(30) not null unique
);
CREATE TABLE MATCH_DATA	
(
match_id INT primary key,
match_date DATE not null,
tournament_stage VARCHAR(30) not null,
weather VARCHAR(20) not null,
tournament_id INT not null,
arena_id INT not null ,
foreign key (tournament_id) references TOURNAMENT(tournament_id),
foreign key (arena_id) references ARENA(arena_id)
);

CREATE TABLE PLAYER_MATCH_STATS	
(
player_id INT not null,
match_id INT not null,
goals INT not null check (goals >= 0),
assists INT not null check (assists >= 0),
saves INT not null check (saves >= 0),
shot_accuracy DECIMAL(5,2) not null check (shot_accuracy >= 0 and shot_accuracy <= 100),
mvp BOOLEAN not null default false,
primary key(player_id, match_id),
foreign key (player_id) references PLAYER(player_id),
foreign key (match_id) references MATCH_DATA(match_id)
);

CREATE TABLE PLAYS_FOR
(
player_id INT not null,
team_id INT not null,
since DATE not null,
until DATE,
check (until is null or until >= since),
primary key (player_id, team_id, since),
foreign key (player_id) references PLAYER(player_id),
foreign key (team_id) references TEAM(team_id)
);

CREATE TABLE PLAYS_AS	
(
team_id INT not null,
match_id INT not null,
team_type VARCHAR(6) not null check (team_type in ('ORANGE', 'BLUE')),
primary key(team_id, match_id),
foreign key (team_id) references TEAM(team_id),
foreign key (match_id) references MATCH_DATA(match_id)
);

CREATE TABLE FAV_PLAYER
(
user_id INT not null, 
player_id  INT not null,
primary key(user_id, player_id),
foreign key (user_id) references APP_USER(user_id),
foreign key (player_id) references PLAYER(player_id)
);

CREATE TABLE FAV_TEAM	
(
user_id INT not null,
team_id  INT not null,
primary key(user_id, team_id),
foreign key (user_id) references APP_USER(user_id),
foreign key (team_id) references TEAM(team_id)
);
