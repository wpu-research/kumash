"use client";

import { useActionState } from "react";
import { placeOrder, type OrderState } from "@/app/actions";

const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Adana", "Kocaeli", "Eskişehir", "Gaziantep", "Kayseri", "Mersin", "Samsun", "Trabzon", "Diğer"];

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-[13px]">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-brand text-[12.5px]">{error}</span>}
    </label>
  );
}

const input = "h-11 rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-brand";

export function CheckoutForm() {
  const [state, action, pending] = useActionState<OrderState, FormData>(placeOrder, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <section className="bg-white rounded-xl border border-line p-5 grid gap-4">
        <h2 className="font-semibold text-[17px]">Teslimat adresi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Ad soyad" error={e.name}><input id="name" name="name" autoComplete="name" className={input} /></Field>
          <Field id="phone" label="Cep telefonu" error={e.phone}><input id="phone" name="phone" autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" className={input} /></Field>
          <Field id="email" label="E-posta" error={e.email}><input id="email" name="email" type="email" autoComplete="email" className={input} /></Field>
          <Field id="city" label="İl" error={e.city}>
            <select id="city" name="city" defaultValue="" className={input}>
              <option value="" disabled>Seçin</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field id="address" label="Açık adres" error={e.address}>
          <textarea id="address" name="address" rows={3} autoComplete="street-address" placeholder="Mahalle, sokak, bina ve daire no, ilçe" className={`${input} h-auto py-2.5`} />
        </Field>
      </section>

      <section className="bg-white rounded-xl border border-line p-5 grid gap-3">
        <h2 className="font-semibold text-[17px]">Ödeme</h2>
        {[
          { v: "kart", t: "Kredi / banka kartı", d: "Test modunda: kart bilgisi alınmaz, ödeme onaylı sayılır." },
          { v: "kapida", t: "Kapıda ödeme", d: "Teslimatta nakit veya kartla ödeyin." },
        ].map((o, i) => (
          <label key={o.v} className="flex gap-3 items-start rounded-lg border border-line p-3.5 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="radio" name="payment" value={o.v} defaultChecked={i === 0} className="mt-1 accent-brand" id={`pay-${o.v}`} />
            <span>
              <b className="font-semibold text-[14px]">{o.t}</b>
              <span className="block text-[12.5px] text-muted">{o.d}</span>
            </span>
          </label>
        ))}
        <label className="flex gap-2.5 items-start text-[13px] mt-2">
          <input type="checkbox" name="terms" id="terms" className="mt-0.5 accent-brand" />
          <span>Ön bilgilendirme formunu ve mesafeli satış sözleşmesini okudum, onaylıyorum.</span>
        </label>
        {e.terms && <span className="text-brand text-[12.5px]">{e.terms}</span>}
      </section>

      {state.message && <p className="rounded-lg bg-brand-soft text-brand px-4 py-3 text-[14px]" role="alert">{state.message}</p>}
      <button disabled={pending} className="h-12 rounded-lg bg-brand text-white font-semibold text-[15px] hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Sipariş oluşturuluyor…" : "Siparişi tamamla"}
      </button>
    </form>
  );
}
