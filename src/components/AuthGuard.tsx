"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const auth = window.localStorage.getItem("tanglaw-auth") === "true";
    if (!auth) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-light text-text-primary px-4">
        <div className="rounded-3xl bg-white border border-accent-muted/40 p-8 shadow-2xl text-center max-w-sm">
          <p className="text-sm font-bold">Verifying access…</p>
          <p className="text-xs text-zinc-500 mt-2">Please wait while we prepare your dashboard.</p>
        </div>
      </div>
    );
  }

  return <>{authorized ? children : null}</>;
}
