"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(login, {});
  return (
    <form action={action} className="mt-6 grid gap-3">
      <label htmlFor="password" className="grid gap-1.5 text-[13px] font-medium">
        Şifre
        <input id="password" name="password" type="password" autoComplete="current-password" autoFocus className="h-11 rounded-lg border border-line px-3 text-[14px] outline-none focus:border-brand" />
      </label>
      {state.error && <p className="text-[13px] text-brand" role="alert">{state.error}</p>}
      <button disabled={pending} className="h-11 rounded-lg bg-brand text-white font-semibold disabled:opacity-60">{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
    </form>
  );
}
