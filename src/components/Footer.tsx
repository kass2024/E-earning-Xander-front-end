import { NavLink } from "@/components/NavLink";
import { Mail, Phone } from "lucide-react";
import { HUB } from "@/lib/hubConfig";

const Footer = () => {
  const links = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/meeting-registration", label: "Book Demo" },
    { to: "/login", label: "Sign In" },
  ];

  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={HUB.logoIcon} alt="" className="h-10 w-10" />
              <div>
                <p className="font-bold">{HUB.name}</p>
                <p className="text-xs text-[#D4AF37]">{HUB.poweredBy}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">{HUB.tagline}</p>
          </div>

          <div>
            <p className="font-semibold mb-3 text-[#D4AF37]">Quick Links</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} className="text-sm text-slate-400 hover:text-white no-underline">
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-3 text-[#D4AF37]">Contact</p>
            <a href={`mailto:${HUB.supportEmail}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2">
              <Mail className="h-4 w-4" /> {HUB.supportEmail}
            </a>
            <a href={`tel:${HUB.supportPhone}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <Phone className="h-4 w-4" /> {HUB.supportPhone}
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} {HUB.company}. All rights reserved.</p>
          <p>{HUB.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
