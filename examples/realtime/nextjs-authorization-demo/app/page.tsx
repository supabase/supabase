import SupabaseLogo from "@/components/SupabaseLogo";
import AuthButton from "../components/AuthButton";

export default async function Index() {
  return (
    <main className="flex flex-col gap-6 items-center h-full mt-40">
      <h2 className="flex items-center gap-6">
        <SupabaseLogo />
        <div>Supaslack</div>
      </h2>
      <AuthButton />
    </main>
  );
}
