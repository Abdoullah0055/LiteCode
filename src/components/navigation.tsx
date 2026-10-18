"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Route,
  Trophy,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";
const items = [
  { href: "/home", label: "Accueil", Icon: House },
  { href: "/path", label: "Parcours", Icon: Route },
  { href: "/challenges", label: "Défis", Icon: Trophy },
  { href: "/projects", label: "Projets", Icon: BriefcaseBusiness },
  { href: "/profile", label: "Profil", Icon: UserRound },
];
export function Navigation() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={path === href ? "active" : ""}
          aria-current={path === href ? "page" : undefined}
        >
          <Icon size={23} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
