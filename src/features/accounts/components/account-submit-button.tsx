"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface AccountSubmitButtonProps {
  label: string;
  pendingLabel: string;
}

export function AccountSubmitButton({
  label,
  pendingLabel,
}: AccountSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? pendingLabel : label}
    </Button>
  );
}
