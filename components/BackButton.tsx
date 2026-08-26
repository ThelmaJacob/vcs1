"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft20Regular } from "@fluentui/react-icons";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back to the previous screen"
      className="btn-ghost"
    >
      <ArrowLeft20Regular className="h-4 w-4" />
      Back
    </button>
  );
}
