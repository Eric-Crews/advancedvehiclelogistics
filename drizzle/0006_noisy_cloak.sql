CREATE TABLE `ai_usage_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_limits_expiry` ON `ai_usage_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `job_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`session_hash` text NOT NULL,
	`input_json` text NOT NULL,
	`assessment_json` text NOT NULL,
	`pricing_json` text NOT NULL,
	`draft_json` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`policy_version` text NOT NULL,
	`load_id` integer,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`load_id`) REFERENCES `loads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_estimates_session` ON `job_estimates` (`session_hash`);--> statement-breakpoint
CREATE INDEX `idx_estimates_expiry` ON `job_estimates` (`expires_at`);--> statement-breakpoint
ALTER TABLE `loads` ADD `estimate_id` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `requirements_verified_at` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `requirements_verification_note` text;