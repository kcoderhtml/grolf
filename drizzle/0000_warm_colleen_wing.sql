CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_name` text,
	`view_id` text,
	`github_user` text,
	`installed` integer,
	`thread_ts` text,
	`expire_time` integer,
	`arcade_session_done` integer
);
