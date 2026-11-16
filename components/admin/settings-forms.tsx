"use client";

import { useActionState } from "react";
import { createCategoryAction, deleteCategoryAction, saveSettingsAction } from "@/app/actions/account";
import type { ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ActionState = {};

export function SettingsForms({
  settings,
  categories,
  notice,
  error,
}: {
  settings: { boardName: string; publicDomain: string; adminDomain: string; showFeatured: boolean };
  categories: { id: string; name: string; count: number }[];
  notice?: string;
  error?: string;
}) {
  const [settingsState, settingsAction] = useActionState(saveSettingsAction, initial);
  const [categoryState, categoryAction] = useActionState(createCategoryAction, initial);

  return (
    <div className="grid max-w-3xl gap-5">
      {notice ? <p className="border-[3px] border-ink bg-electric px-3 py-2 font-bold">{notice}</p> : null}
      {error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{error}</p> : null}
      <form action={settingsAction} className="grid gap-4 border-[3px] border-ink bg-white p-5">
        <h2 className="text-2xl font-black">Workspace</h2>
        {settingsState.error ? <p className="font-bold text-coral">{settingsState.error}</p> : null}
        {settingsState.message ? <p className="font-bold">{settingsState.message}</p> : null}
        <div className="grid gap-2">
          <Label htmlFor="boardName">Board name</Label>
          <Input id="boardName" name="boardName" defaultValue={settings.boardName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="publicDomain">Public domain</Label>
          <Input id="publicDomain" name="publicDomain" defaultValue={settings.publicDomain} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="adminDomain">Admin domain</Label>
          <Input id="adminDomain" name="adminDomain" defaultValue={settings.adminDomain} />
        </div>
        <label className="flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase">
          <input type="checkbox" name="showFeatured" defaultChecked={settings.showFeatured} className="size-4 accent-ink" />
          Featured jobs on homepage
        </label>
        <SubmitButton variant="cobalt" pendingLabel="Saving…">Save settings</SubmitButton>
      </form>
      <section className="grid gap-4 border-[3px] border-ink bg-white p-5">
        <h2 className="text-2xl font-black">Categories</h2>
        {categoryState.error ? <p className="font-bold text-coral">{categoryState.error}</p> : null}
        {categoryState.message ? <p className="font-bold">{categoryState.message}</p> : null}
        <form action={categoryAction} className="flex flex-wrap gap-2">
          <Input name="name" placeholder="New category" className="max-w-xs" />
          <SubmitButton variant="outline" pendingLabel="Adding…">Add</SubmitButton>
        </form>
        <div className="grid gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 border-[3px] border-ink px-3 py-2">
              <p className="font-black">{category.name} <span className="text-sm font-bold">{category.count} open</span></p>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={category.id} />
                <SubmitButton variant="coral" size="sm" pendingLabel="Removing…">Delete</SubmitButton>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
