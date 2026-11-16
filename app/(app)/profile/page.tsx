import { Suspense } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/session";
import { liveRequest } from "@/lib/live";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <p className="section-kicker">Account</p>
      <h1 className="mt-2 text-5xl font-black">YOUR PROFILE.</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="font-black">Loading profile…</div>}>
          <ProfileContent />
        </Suspense>
      </div>
    </div>
  );
}

async function ProfileContent() {
  await liveRequest();
  const user = await requireUser();
  return <ProfileForm user={user} />;
}
