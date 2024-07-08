CREATE TABLE `analytics` (
	`id` integer PRIMARY KEY NOT NULL,
	`day` text,
	`total_commits` integer,
	`total_releases` integer,
	`new_users` integer
);
