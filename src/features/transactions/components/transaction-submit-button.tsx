"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface TransactionSubmitButtonProps {
  label: string;
  pendingLabel: string;
}

export function TransactionSubmitButton({
  label,
  pendingLabel,
}: TransactionSubmitButtonProps) {
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
