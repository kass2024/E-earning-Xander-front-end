import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { HUB } from "@/lib/hubConfig";

const Navbar = () => {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/meeting-registration", label: "Book Demo" },
  ];

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const sync = () => {
      document.documentElement.style.setProperty("--public-header-height", `${header.offsetHeight}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
      id="public-site-header"
      className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0f]/95 backdrop-blur border-b border-white/5"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 no-underline">
          <img src={HUB.logoIcon} alt="" className="h-8 w-8" />
          <span className="font-bold text-white hidden sm:inline">{HUB.name}</span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-sm text-slate-400 hover:text-[#D4AF37] transition-colors no-underline"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button className="bg-[#D4AF37] text-black hover:bg-[#c9a030]" onClick={() => navigate("/pricing")}>
            Get Started
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0f] px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="block py-2 text-slate-300 hover:text-[#D4AF37] no-underline"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <Button className="w-full bg-[#D4AF37] text-black mt-2" onClick={() => { navigate("/pricing"); setIsMenuOpen(false); }}>
            Get Started
          </Button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
