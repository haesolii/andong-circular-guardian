CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`place` text NOT NULL,
	`status` text DEFAULT '접수' NOT NULL,
	`photo_key` text,
	`photo_content_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reports_created_at` ON `reports` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reports_category_created_at` ON `reports` (`category`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reports_status_created_at` ON `reports` (`status`,`created_at`);