import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

const SUPPORT_PHONE = '0742756074';
const SUPPORT_EMAIL = 'robertweda993@gmail.com';

const faqs = [
  {
    q: 'How do I sell chickens on Kuku Market?',
    a: 'Tap the Sell button on the bottom navigation, fill in details about your chickens, and publish your listing.',
  },
  {
    q: 'How does payment work?',
    a: 'Payments are processed via M-Pesa. Once a buyer pays, the funds enter your wallet as pending and become available after order completion.',
  },
  {
    q: 'What is the platform fee?',
    a: 'Kuku Market charges a 2.5% platform fee on each transaction, automatically deducted from the seller\'s earnings.',
  },
  {
    q: 'How do I withdraw my earnings?',
    a: 'Go to your Wallet page and tap "Withdraw to M-Pesa". Enter the amount and confirm to receive funds to your registered number.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
        </div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center gap-4 px-5 py-4 border-b border-border active:bg-muted/50 transition-colors"
          >
            <Phone className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Call Us</p>
              <p className="text-sm text-muted-foreground">{SUPPORT_PHONE}</p>
            </div>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-4 px-5 py-4 border-b border-border active:bg-muted/50 transition-colors"
          >
            <Mail className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Email Us</p>
              <p className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
          </a>
          <a
            href={`https://wa.me/254${SUPPORT_PHONE.slice(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 active:bg-muted/50 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">WhatsApp</p>
              <p className="text-sm text-muted-foreground">Chat with us on WhatsApp</p>
            </div>
          </a>
        </motion.div>

        {/* FAQ */}
        <div>
          <h2 className="font-semibold text-foreground mb-3">Frequently Asked Questions</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border">
                <p className="font-medium text-sm text-foreground">{faq.q}</p>
                <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
