import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const SUPPORT_PHONE = '0742756074';
const SUPPORT_EMAIL = 'robertweda993@gmail.com';

export function DesktopFooter() {
  return (
    <footer className="hidden md:block bg-card border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold text-primary mb-3">Kuku Market</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kenya's premier live poultry marketplace. Connecting farmers and buyers across all 47 counties.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Marketplace</h4>
            <ul className="space-y-2">
              {[
                { label: 'Browse Listings', to: '/' },
                { label: 'Search', to: '/search' },
                { label: 'Sell Chickens', to: '/sell' },
                { label: 'My Orders', to: '/orders' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Account</h4>
            <ul className="space-y-2">
              {[
                { label: 'Profile', to: '/profile' },
                { label: 'Wallet', to: '/wallet' },
                { label: 'Settings', to: '/settings' },
                { label: 'Help & Support', to: '/help' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${SUPPORT_PHONE}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 shrink-0" />
                  {SUPPORT_PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 shrink-0" />
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kuku Market. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href={`https://wa.me/254${SUPPORT_PHONE.slice(1)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              WhatsApp
            </a>
            <span className="text-xs text-muted-foreground">•</span>
            <Link to="/help" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
