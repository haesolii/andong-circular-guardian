CREATE TABLE `environment_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_environment_documents_kind` ON `environment_documents` (`kind`);--> statement-breakpoint
CREATE TABLE `environment_records` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`village_id` text NOT NULL,
	`period` text NOT NULL,
	`payload` text NOT NULL,
	`photo_key` text,
	`client_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_environment_records_created` ON `environment_records` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_environment_records_client` ON `environment_records` (`client_hash`,`created_at`);