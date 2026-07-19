CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"total" integer NOT NULL,
	"score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"position" integer NOT NULL,
	"topic" text NOT NULL,
	"difficulty" text NOT NULL,
	"grounded" boolean NOT NULL,
	"stem" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"source_video_id" text,
	"source_video_title" text,
	"source_start_seconds" real,
	"source_end_seconds" real,
	"chosen_index" integer,
	"correct" boolean
);
--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempts_user" ON "quiz_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_attempt" ON "quiz_questions" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_user_topic" ON "quiz_questions" USING btree ("user_id","topic");