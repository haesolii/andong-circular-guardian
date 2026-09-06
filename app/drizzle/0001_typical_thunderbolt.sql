ALTER TABLE `reports` ADD `client_hash` text;--> statement-breakpoint
CREATE INDEX `idx_reports_client_created_at` ON `reports` (`client_hash`,`created_at`);