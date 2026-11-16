"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HomeSearch() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (title) params.set("q", title);
    if (location) params.set("location", location);
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 border-[3px] border-ink bg-ink p-4 text-white hard-shadow md:grid-cols-[1fr_1fr_auto] md:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="title" className="text-electric">
          Job title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Frontend, product, data…"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="location" className="text-electric">
          Location
        </Label>
        <Input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Cairo, remote, Berlin…"
        />
      </div>
      <Button type="submit" variant="electric" size="lg" className="w-full md:w-auto">
        <Search />
        Search
      </Button>
    </form>
  );
}
