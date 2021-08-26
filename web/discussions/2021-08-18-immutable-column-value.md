---
title: Immutable column value
author: tmt-devq
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/89100093?v=4
author_url: https://github.com/tmt-devq
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi,

I've added an 'updated_at' column to a table and created a trigger to update to the current timestamp via the moddatetime extension whenever a new record gets inserted or an update is made. How can I prevent users from passing through a value when they post an update? I've tried it with a function and trigger like the below (just silently resetting the value but I will raise an exception here rather), but I am still able to insert a new record and specify an 'updated_at' value through the rest call?

```
create function tester() returns trigger language plpgsql as $$
begin
  new.updated_at = old.updated_at;
  return new;
end $$;

CREATE TRIGGER a_test_trigger BEFORE UPDATE ON items 
FOR EACH ROW EXECUTE PROCEDURE tester();
```

Thank you
