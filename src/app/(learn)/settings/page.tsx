import { accountData } from "@/lib/data";
import { Back } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";
import { cookies } from "next/headers";
import { REMEMBER_DEVICE_COOKIE, shouldRememberDevice } from "@/lib/auth-policy";
export default async function Settings() {
  const a = await accountData();
  const jar = await cookies();
  return (
    <section className="screen-page">
      <div className="page-content">
        <Back href="/profile" title="Paramètres" />
        <SettingsForm
          name={a.name}
          settings={a.settings}
          email={a.user.email || ""}
          rememberDevice={shouldRememberDevice(jar.get(REMEMBER_DEVICE_COOKIE)?.value)}
        />
      </div>
    </section>
  );
}
