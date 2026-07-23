PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`library_name` text,
	`library_description` text,
	`library_slug` text,
	`max_catalogs` integer DEFAULT 2 NOT NULL,
	`catalogs_created` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`role` text DEFAULT 'reader' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("id", "email", "password_hash", "library_name", "library_description", "library_slug", "max_catalogs", "catalogs_created", "is_active", "role", "created_at", "updated_at") SELECT "id", "email", "password_hash", "library_name", "library_description", "library_slug", "max_catalogs", "catalogs_created", "is_active", "role", "created_at", "updated_at" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_email` ON `profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_library_slug` ON `profiles` (`library_slug`);