CREATE TABLE `direct_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`driver_id` text NOT NULL,
	`shipper_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `direct_listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_reviews_listing_id_unique` ON `direct_reviews` (`listing_id`);--> statement-breakpoint
CREATE INDEX `idx_direct_reviews_driver` ON `direct_reviews` (`driver_id`);--> statement-breakpoint
ALTER TABLE `drivers` ADD `about` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `service_area` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `vehicle_details` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `business_type` text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `insurance_description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `vehicle_photo_key` text;--> statement-breakpoint
ALTER TABLE `drivers` ADD `profile_photo_key` text;