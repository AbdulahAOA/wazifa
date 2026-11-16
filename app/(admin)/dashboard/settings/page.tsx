import { Suspense } from "react";
import { createCategoryForm, deleteCategoryAction, saveSettingsForm } from "@/app/actions/account";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { first } from "@/lib/query";
import { getSettings, listCategories } from "@/lib/services/settings";

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="font-black">Loading settings…</p>}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SettingsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await liveRequest();
  const params = await searchParams;
  const db = await getDb();
  const [settings, categories] = await Promise.all([getSettings(db), listCategories(db)]);

  return (
    <div className="grid max-w-3xl gap-5">
      <div>
        <p className="section-kicker">Workspace</p>
        <h1 className="text-4xl font-black">SETTINGS.</h1>
      </div>
      {first(params.notice) ? <p className="border-[3px] border-ink bg-electric px-3 py-2 font-bold">{first(params.notice)}</p> : null}
      {first(params.error) ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{first(params.error)}</p> : null}
      <form action={saveSettingsForm} className="grid gap-4 border-[3px] border-ink bg-white p-5">
        <div className="grid gap-2">
          <Label htmlFor="boardName">Board name</Label>
          <Input id="boardName" name="boardName" defaultValue={settings.boardName} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="publicDomain">Public domain</Label>
            <Input id="publicDomain" name="publicDomain" defaultValue={settings.publicDomain} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="adminDomain">Admin domain</Label>
            <Input id="adminDomain" name="adminDomain" defaultValue={settings.adminDomain} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase">
          <input
            type="checkbox"
            name="showFeatured"
            defaultChecked={settings.showFeatured}
            className="size-4 accent-ink"
          />
          Featured jobs on homepage
        </label>
        <SubmitButton variant="cobalt">Save settings</SubmitButton>
      </form>
      <section className="border-[3px] border-ink bg-pale p-5">
        <h2 className="text-2xl font-black">Categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <span className={`border-[2px] border-ink px-2 py-1 text-xs font-extrabold uppercase ${category.color}`}>
                {category.name}
              </span>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={category.id} />
                <SubmitButton variant="coral" size="sm" pendingLabel="Removing…">Delete</SubmitButton>
              </form>
            </div>
          ))}
        </div>
        <form action={createCategoryForm} className="mt-4 flex flex-wrap gap-2">
          <Input name="name" placeholder="New category" className="max-w-xs" />
          <SubmitButton variant="outline">Add category</SubmitButton>
        </form>
      </section>
    </div>
  );
}
