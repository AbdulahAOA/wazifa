"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function pathFromResponseUrl(responseUrl: string) {
  const url = new URL(responseUrl);
  return `${url.pathname}${url.search}`;
}

async function submitAdminUserForm(
  event: React.FormEvent<HTMLFormElement>,
  navigate: (path: string) => void,
) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = new FormData(form);
  const returnTo = String(body.get("returnTo") ?? "/dashboard/users");

  const response = await fetch(form.action, {
    method: "POST",
    body,
    credentials: "same-origin",
    redirect: "follow",
  });

  if (response.redirected && response.url) {
    navigate(pathFromResponseUrl(response.url));
    return;
  }

  if (response.ok) {
    navigate(returnTo);
    return;
  }

  navigate(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Something went wrong. Try again.")}`);
}

export function UserRowActions({
  userId,
  name,
  email,
  role,
  applicationCount,
  deactivated,
  isCurrentAdmin,
  returnPath,
}: {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "candidate";
  applicationCount: number;
  deactivated: boolean;
  isCurrentAdmin: boolean;
  returnPath: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigateAfterMutation = (path: string) => {
    router.push(path);
    router.refresh();
  };

  const canDelete = role === "candidate" && !isCurrentAdmin && applicationCount === 0 && !deactivated;
  const canDeactivate = role === "candidate" && !isCurrentAdmin && !deactivated;
  const blockedAdmin = role === "admin" || isCurrentAdmin;

  if (blockedAdmin) {
    return <span className="text-xs font-bold uppercase text-ink/50">Protected</span>;
  }

  if (deactivated) {
    return <span className="text-xs font-extrabold uppercase text-ink/70">Deactivated</span>;
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="coral"
        size="sm"
        className="shadow-[3px_3px_0_0_#111111]"
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    try {
      await submitAdminUserForm(event, navigateAfterMutation);
    } catch {
      setSubmitting(false);
      navigateAfterMutation(
        `${returnPath}${returnPath.includes("?") ? "&" : "?"}error=${encodeURIComponent("Network error. Try again.")}`,
      );
    }
  };

  return (
    <div
      className="grid min-w-[260px] gap-2 border-[3px] border-ink bg-pale p-3 shadow-[4px_4px_0_0_#111111]"
      role="dialog"
      aria-labelledby={`delete-user-${userId}`}
      aria-modal="true"
    >
      <p id={`delete-user-${userId}`} className="text-xs font-bold leading-snug">
        {canDelete
          ? `Permanently delete ${name} (${email})? This cannot be undone.`
          : `Delete ${name} (${email})?`}
      </p>
      {!canDelete ? (
        <p className="text-xs font-bold leading-snug">
          {applicationCount > 0
            ? `This account has ${applicationCount} application(s). Permanent deletion is blocked to protect hiring records. Deactivate instead to revoke sign-in access.`
            : "Permanent deletion is not available for this account."}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canDelete ? (
          <form action="/api/admin/delete-user" method="POST" onSubmit={onSubmit}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="returnTo" value={returnPath} />
            <Button
              type="submit"
              variant="coral"
              size="sm"
              disabled={submitting}
              className="shadow-[3px_3px_0_0_#111111]"
            >
              {submitting ? "Deleting…" : "Confirm delete"}
            </Button>
          </form>
        ) : null}
        {canDeactivate && !canDelete ? (
          <form action="/api/admin/deactivate-user" method="POST" onSubmit={onSubmit}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="returnTo" value={returnPath} />
            <Button
              type="submit"
              variant="cobalt"
              size="sm"
              disabled={submitting}
              className="shadow-[3px_3px_0_0_#111111]"
            >
              {submitting ? "Deactivating…" : "Deactivate instead"}
            </Button>
          </form>
        ) : null}
        <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
