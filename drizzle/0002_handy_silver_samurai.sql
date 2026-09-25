ALTER TABLE `loads` ADD `category` text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `loads` ADD `pickup_type` text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `loads` ADD `carry_help` text DEFAULT 'unsure' NOT NULL;--> statement-breakpoint
ALTER TABLE `loads` ADD `contact_phone` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `contact_preference` text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `loads` ADD `listing_url` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `quote_cents` integer;--> statement-breakpoint
ALTER TABLE `loads` ADD `quote_note` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `quote_source` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `quoted_at` text;