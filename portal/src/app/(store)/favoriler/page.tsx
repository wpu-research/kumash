import { Favorites } from "./favorites";

export const metadata = { title: "Favorilerim" };

export default function Page() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6">
      <h1 className="text-[22px] font-semibold">Favorilerim</h1>
      <p className="text-[13px] text-muted mt-0.5">Favoriler bu cihazda saklanır.</p>
      <div className="mt-5"><Favorites /></div>
    </div>
  );
}
