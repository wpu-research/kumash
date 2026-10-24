import { LoginForm } from "./login-form";

export const metadata = { title: "Panel girişi" };

export default function Page() {
  return (
    <div className="min-h-dvh grid place-items-center bg-[#1A0910] px-4">
      <div className="w-full max-w-[380px] bg-white rounded-2xl p-7 shadow-2xl">
        <div className="font-display text-[36px] leading-none">Kuma<i className="text-brand">sh</i></div>
        <p className="text-[13px] text-muted mt-2">Mağaza yönetim paneli</p>
        <LoginForm />
      </div>
    </div>
  );
}
