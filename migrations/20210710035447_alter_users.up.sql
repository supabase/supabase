-- alter user schema

ALTER TABLE {{ index .Options "Namespace" }}.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(15) NULL UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS phone_confirmed_at timestamptz NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS phone_change VARCHAR(15) NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_change_token VARCHAR(255) NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_change_sent_at timestamptz NULL DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_schema = '{{ index .Options "Namespace" }}' and table_name='users' and column_name='email_confirmed_at')
  THEN
      ALTER TABLE "{{ index .Options "Namespace" }}"."users" RENAME COLUMN "confirmed_at" TO "email_confirmed_at";
  END IF;
END $$;

