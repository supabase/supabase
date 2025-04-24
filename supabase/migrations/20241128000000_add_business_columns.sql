ALTER TABLE businesses
ADD COLUMN business_hours text[] DEFAULT '{}',
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision; 