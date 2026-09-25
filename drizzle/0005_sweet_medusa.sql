CREATE TABLE `delivery_options` (
	`id` text PRIMARY KEY NOT NULL,
	`load_id` integer NOT NULL,
	`provider` text NOT NULL,
	`cost_cents` integer NOT NULL,
	`extra_cents` integer DEFAULT 0 NOT NULL,
	`service` text NOT NULL,
	`timing` text NOT NULL,
	`availability` text DEFAULT 'unconfirmed' NOT NULL,
	`valid_until` text,
	`internal_note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`load_id`) REFERENCES `loads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_options_load` ON `delivery_options` (`load_id`);--> statement-breakpoint
CREATE TABLE `delivery_quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`load_id` integer NOT NULL,
	`option_id` text NOT NULL,
	`provider` text NOT NULL,
	`cost_cents` integer NOT NULL,
	`extra_cents` integer NOT NULL,
	`price_cents` integer NOT NULL,
	`fee_bps` integer NOT NULL,
	`fixed_fee_cents` integer NOT NULL,
	`scope` text NOT NULL,
	`timing` text NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`created_at` text NOT NULL,
	`attempt_id` text,
	`stripe_session_id` text,
	`checkout_url` text,
	`stripe_payment_intent` text,
	`paid_at` text,
	`payment_reference` text,
	`payment_method` text,
	FOREIGN KEY (`load_id`) REFERENCES `loads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_quotes_load` ON `delivery_quotes` (`load_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_intent` ON `delivery_quotes` (`stripe_payment_intent`);--> statement-breakpoint
CREATE TABLE `desk_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`load_id` integer NOT NULL,
	`actor` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`load_id`) REFERENCES `loads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_load` ON `desk_events` (`load_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`load_id` integer NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`load_id`) REFERENCES `loads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_load` ON `notifications` (`load_id`);--> statement-breakpoint
ALTER TABLE `loads` ADD `current_quote_id` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `booking_status` text DEFAULT 'not_booked' NOT NULL;--> statement-breakpoint
ALTER TABLE `loads` ADD `booking_reference` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `booked_provider` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `booking_note` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `booked_at` text;--> statement-breakpoint
ALTER TABLE `loads` ADD `actual_cost_cents` integer;