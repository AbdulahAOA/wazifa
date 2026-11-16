import { revalidatePath } from "next/cache";

export function revalidateMarketplace(jobId?: string) {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/applications");
  revalidatePath("/saved");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/notifications");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath(`/jobs/${jobId}/apply`);
  }
}
