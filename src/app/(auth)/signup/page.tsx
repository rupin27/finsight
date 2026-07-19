import Link from "next/link";
import { ArrowRight, UserRoundPlus } from "lucide-react";

import { signup } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <Card className="border-white/10 bg-white/[0.035] shadow-2xl shadow-black/40 backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-7">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <UserRoundPlus className="size-5 text-cyan-300" />
        </div>

        <div>
          <CardTitle className="text-2xl text-white">
            Create your account
          </CardTitle>

          <CardDescription className="mt-2 text-white/45">
            Start building your private financial command center.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {params.error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {params.message}
          </div>
        )}

        <form action={signup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white/70">
              Full name
            </Label>

            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Rupin Mehra"
              required
              className="h-12 border-white/10 bg-white/[0.045] text-white placeholder:text-white/25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">
              Email address
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-12 border-white/10 bg-white/[0.045] text-white placeholder:text-white/25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70">
              Password
            </Label>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              className="h-12 border-white/10 bg-white/[0.045] text-white placeholder:text-white/25"
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          >
            Create account
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-300 hover:text-cyan-200"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
