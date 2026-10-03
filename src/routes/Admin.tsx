import { useState } from "react";
import { AdminPanel, type AdminStatus } from "../components/AdminPanel.tsx";
import { type AdminStats, adminStats, adminWipe, LockedOutError, NetworkError } from "../lib/api.ts";

export function Admin() {
  const [status, setStatus] = useState<AdminStatus>("locked");
  const [passphrase, setPassphrase] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      if (error instanceof NetworkError) setNotice("Couldn't reach the board. Try again.");
      else if (error instanceof LockedOutError) setNotice("Too many wrong passphrases. Wait ten minutes and try again.");
      else throw error;
    } finally {
      setBusy(false);
    }
  };

  const unlock = () =>
    run(async () => {
      const result = await adminStats(passphrase);
      if (result) {
        setStats(result);
        setStatus("ready");
      } else {
        setStatus("wrong");
      }
    });

  const wipe = () =>
    run(async () => {
      await adminWipe(passphrase);
      setStatus("wiped");
    });

  const back = () =>
    run(async () => {
      setStats(await adminStats(passphrase));
      setStatus("ready");
    });

  return (
    <div className="cork flex min-h-screen items-center justify-center p-6">
      <AdminPanel
        status={status}
        passphrase={passphrase}
        stats={stats}
        busy={busy}
        notice={notice}
        onPassphraseChange={setPassphrase}
        onUnlock={unlock}
        onAskWipe={() => setStatus("confirm")}
        onCancelWipe={() => setStatus("ready")}
        onWipe={wipe}
        onBack={back}
      />
    </div>
  );
}
