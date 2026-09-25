CREATE TABLE `bids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`load_id` integer NOT NULL,
	`carrier_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`mc_number` text NOT NULL,
	`equipment` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`status` text DEFAULT 'pending_verification' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`load_id`) REFERENCES `loads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bids_load` ON `bids` (`load_id`);--> statement-breakpoint
CREATE TABLE `loads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`origin` text NOT NULL,
	`destination` text NOT NULL,
	`pickup_date` text NOT NULL,
	`length_ft` real,
	`weight_lbs` integer,
	`equipment` text NOT NULL,
	`loading` text NOT NULL,
	`unloading` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`broker_name` text,
	`status` text DEFAULT 'broker_review' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_loads_status_created` ON `loads` (`status`,`created_at`);