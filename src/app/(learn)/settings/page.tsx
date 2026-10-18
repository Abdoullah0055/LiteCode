import { accountData } from "@/lib/data";
import { Back } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";
export default async function Settings() {
  const a = await accountData();
  return (
    <section className="screen-page">
      <div className="page-content">
        <Back href="/profile" title="Paramètres" />
        <SettingsForm
          name={a.name}
          settings={a.settings}
          email={a.user.email || ""}
        />
      </div>
    </section>
  );
}
