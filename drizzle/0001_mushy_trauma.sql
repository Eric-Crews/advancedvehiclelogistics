CREATE TABLE `drivers` (
	`clerk_user_id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`mc_number` text NOT NULL,
	`dot_number` text,
	`equipment` text NOT NULL,
	`status` text DEFAULT 'pending_verification' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bids` ADD `driver_clerk_id` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `customer_clerk_id` text;