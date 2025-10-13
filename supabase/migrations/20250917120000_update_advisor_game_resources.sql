-- Rename max_resources column to resources so that it represents the mutable
-- count of resources available to an advisor game.
ALTER TABLE public.advisor_games
RENAME COLUMN max_resources TO resources;

-- Recreate the non-negative constraint with an updated name.
ALTER TABLE public.advisor_games
DROP CONSTRAINT IF EXISTS advisor_games_max_resources_check;

ALTER TABLE public.advisor_games
ADD CONSTRAINT advisor_games_resources_check CHECK (resources >= 0);

-- Update broadcast function to emit the new resources column.
CREATE OR REPLACE FUNCTION public.broadcast_advisor_game_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_project_ref text := coalesce(NEW.project_ref, OLD.project_ref);
  v_resources integer;
  v_used integer;
  v_blocks jsonb;
  v_players jsonb;
begin
  if v_project_ref is null then
    return null;
  end if;

  select resources
    into v_resources
  from public.advisor_games
  where project_ref = v_project_ref;

  if v_resources is null then
    return null;
  end if;

  select coalesce(count(*), 0)
    into v_used
  from public.advisor_blocks
  where project_ref = v_project_ref;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', b.id,
               'cube_key', b.cube_key,
               'position', jsonb_build_array(b.pos_x, b.pos_y, b.pos_z),
               'texture', b.texture,
               'created_by', b.created_by,
               'created_at', b.created_at
             )
             order by b.created_at
           ),
           '[]'::jsonb
         )
    into v_blocks
  from public.advisor_blocks b
  where b.project_ref = v_project_ref;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', p.id,
               'user_id', p.user_id,
               'display_name', p.display_name,
               'presence', p.presence,
               'joined_at', p.joined_at,
               'last_seen_at', p.last_seen_at
             )
             order by p.joined_at
           ),
           '[]'::jsonb
         )
    into v_players
  from public.advisor_players p
  where p.project_ref = v_project_ref;

  perform realtime.send(
    jsonb_build_object(
      'project_ref', v_project_ref,
      'resources', v_resources,
      'used_resources', v_used,
      'blocks', v_blocks,
      'players', v_players,
      'updated_at', now()
    ),
    'state_update',
    format('advisor_game:%s', v_project_ref),
    false
  );

  return null;
exception
  when undefined_function then
    raise notice 'realtime.send function is not available; skipping advisor broadcast';
  when others then
    raise warning 'advisor broadcast failed for %: %', v_project_ref, sqlerrm;
    return null;
end;
$function$;
