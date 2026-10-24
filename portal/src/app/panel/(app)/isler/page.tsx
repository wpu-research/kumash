import { desc } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { Chip, JOB_STATUS, PageTitle, fmtDate } from "@/components/admin-ui";

export const metadata = { title: "İş kayıtları" };

const TYPE = { process_shoot: "Çekim işleme", publish_product: "Kanallara yayın", sync_stock: "Stok senkronu" } as Record<string, string>;

export default async function Page() {
  const d = await db();
  const list = await d.select().from(jobs).orderBy(desc(jobs.id)).limit(60);
  const cost = list.reduce((s, j) => s + j.costCents, 0);
  return (
    <>
      <PageTitle title="İş kayıtları" sub={`Kuyruktaki son ${list.length} iş · tahmini AI maliyeti ${(cost / 100).toFixed(2)} USD`} />
      <div className="grid gap-2">
        {list.length === 0 && <div className="bg-white rounded-xl border border-line p-10 text-center text-muted">Henüz iş yok.</div>}
        {list.map((j) => (
          <details key={j.id} className="bg-white rounded-xl border border-line group">
            <summary className="p-4 cursor-pointer grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center list-none">
              <div className="min-w-0">
                <div className="font-medium text-[14px]">#{j.id} {TYPE[j.type] ?? j.type} <span className="text-muted font-normal font-mono text-[12px]">{JSON.stringify(j.payload)}</span></div>
                <div className="text-[12.5px] text-muted truncate">{j.error ?? j.log.at(-1)?.msg ?? "—"}</div>
              </div>
              <div className="text-right">
                <Chip className={JOB_STATUS[j.status][1]}>{JOB_STATUS[j.status][0]}</Chip>
                <div className="text-[11.5px] text-muted mt-1">{fmtDate(j.createdAt)} · {j.attempts}. deneme</div>
              </div>
            </summary>
            <ol className="px-4 pb-4 font-mono text-[12px] grid gap-1 border-t border-line pt-3">
              {j.log.map((l, i) => (
                <li key={i} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2"><span className="text-muted">{new Date(l.at).toLocaleTimeString("tr-TR")}</span><span className="break-words">{l.msg}</span></li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </>
  );
}
