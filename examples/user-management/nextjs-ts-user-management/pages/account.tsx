import { useState } from "react";
import { useSupabaseClient, User } from "@supabase/auth-helpers-react";
import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import { Database } from "../utils/database.types";
import { useRouter } from "next/router";
type Profiles = Database["public"]["Tables"]["profiles"]["Row"];

// Server-side rendering (SSR) example
export const getServerSideProps = withPageAuth<Database>({
  async getServerSideProps(ctx, supabaseServerClient) {
    const {
      data: { user },
    } = await supabaseServerClient.auth.getUser();

    const { data: profile } = await supabaseServerClient
      .from("profiles")
      .select(`username, website, avatar_url`)
      .eq("id", user!.id)
      .single();
    return { props: { profile } };
  },
});

export default function Account({
  user,
  profile,
}: {
  user: User;
  profile: Profiles;
}) {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<Profiles["username"]>(
    profile.username
  );
  const [website, setWebsite] = useState<Profiles["website"]>(profile.website);
  const [avatar_url, setAvatarUrl] = useState<Profiles["avatar_url"]>(
    profile.avatar_url
  );

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: Profiles["username"];
    website: Profiles["website"];
    avatar_url: Profiles["avatar_url"];
  }) {
    try {
      setLoading(true);

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      alert("Data updated!");
    } catch (error) {
      alert("Error updating the data!");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-widget">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={user?.email} disabled />
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username || ""}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="website"
          value={website || ""}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button
          className="button primary block"
          onClick={() => updateProfile({ username, website, avatar_url })}
          disabled={loading}
        >
          {loading ? "Loading ..." : "Update"}
        </button>
      </div>

      <div>
        <button
          className="button block"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
