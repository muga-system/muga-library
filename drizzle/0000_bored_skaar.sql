CREATE TABLE `cdu_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`parent_code` text,
	`description` text,
	`examples` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cdu_code` ON `cdu_classes` (`code`);--> statement-breakpoint
CREATE TABLE `coupon_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`library_name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`processed_by` text,
	`processed_at` text,
	`admin_notes` text,
	FOREIGN KEY (`processed_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_coupon_requests_status` ON `coupon_requests` (`status`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`used_at` text,
	`user_id` text,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`uses_count` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`expires_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_coupons_code` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `databases` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`owner_id` text,
	`is_public` integer DEFAULT false NOT NULL,
	`catalog_type` text DEFAULT 'general' NOT NULL,
	`library_visibility` text DEFAULT 'private' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_databases_owner` ON `databases` (`owner_id`);--> statement-breakpoint
CREATE TABLE `field_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`database_id` text NOT NULL,
	`tag` text NOT NULL,
	`label` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`is_repeatable` integer DEFAULT false NOT NULL,
	`is_subfield` integer DEFAULT false NOT NULL,
	`parent_tag` text,
	`required` integer DEFAULT false NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`database_id`) REFERENCES `databases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_field_definitions_tag_db` ON `field_definitions` (`database_id`,`tag`);--> statement-breakpoint
CREATE TABLE `loan_config` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_loan_config_key` ON `loan_config` (`key`);--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`database_id` text NOT NULL,
	`record_id` text NOT NULL,
	`borrower_type` text NOT NULL,
	`borrower_name` text NOT NULL,
	`borrower_course` text,
	`borrower_division` text,
	`borrower_department` text,
	`loan_date` text NOT NULL,
	`due_date` text NOT NULL,
	`return_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_by` text,
	`rejection_reason` text,
	`approved_by` text,
	`approved_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`database_id`) REFERENCES `databases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_loans_status` ON `loans` (`status`);--> statement-breakpoint
CREATE INDEX `idx_loans_record` ON `loans` (`record_id`);--> statement-breakpoint
CREATE INDEX `idx_loans_created_by_record_status` ON `loans` (`created_by`,`record_id`,`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`library_name` text,
	`library_description` text,
	`library_slug` text,
	`max_catalogs` integer DEFAULT 2 NOT NULL,
	`catalogs_created` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`role` text DEFAULT 'librarian' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_email` ON `profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_library_slug` ON `profiles` (`library_slug`);--> statement-breakpoint
CREATE TABLE `record_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`data` text NOT NULL,
	`version_number` integer NOT NULL,
	`changed_by` text,
	`change_type` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`database_id` text NOT NULL,
	`mfn` integer,
	`data` text NOT NULL,
	`total_ejemplares` integer DEFAULT 1 NOT NULL,
	`disponibles` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`database_id`) REFERENCES `databases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_records_database` ON `records` (`database_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);