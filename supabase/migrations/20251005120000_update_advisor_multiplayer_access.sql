DROP POLICY IF EXISTS "project members can select advisor_games"
ON public.advisor_games;

CREATE POLICY "advisor games can be viewed by anyone"
ON public.advisor_games
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "project members can view advisor_blocks"
ON public.advisor_blocks;

CREATE POLICY "advisor blocks can be viewed by anyone"
ON public.advisor_blocks
FOR SELECT
TO public
USING (true);

-- Permit realtime broadcasts for advisor games to reach all authenticated clients.
ALTER POLICY "project members can receive advisor_game broadcasts"
ON realtime.messages
USING (
  (extension = 'broadcast'::text)
  AND (split_part(realtime.topic(), ':'::text, 1) = 'advisor_game')
);
