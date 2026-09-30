CREATE TABLE `direct_listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shipper_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`origin` text NOT NULL,
	`destination` text NOT NULL,
	`pickup_date` text NOT NULL,
	`equipment` text NOT NULL,
	`weight_lbs` integer,
	`length_ft` real,
	`handling` text NOT NULL,
	`offered_cents` integer NOT NULL,
	`shipper_name` text NOT NULL,
	`shipper_email` text NOT NULL,
	`shipper_phone` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`stripe_session_id` text,
	`selected_offer_id` integer,
	`created_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_listings_stripe_session_id_unique` ON `direct_listings` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `idx_direct_listings_public` ON `direct_listings` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_direct_listings_shipper` ON `direct_listings` (`shipper_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `direct_offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`driver_id` text NOT NULL,
	`driver_name` text NOT NULL,
	`driver_email` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `direct_listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_direct_offers_listing` ON `direct_offers` (`listing_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_direct_offers_driver` ON `direct_offers` (`listing_id`,`driver_id`);