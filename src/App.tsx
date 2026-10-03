import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/NavBar';
import { DemoSwitcher } from '@/components/layout/DemoSwitcher';
import { Toasts } from '@/components/common/Toasts';
import { PointsCelebration } from '@/components/common/PointsCelebration';
import { CommandPalette } from '@/components/common/CommandPalette';
import { ClientHome } from '@/modules/home/ClientHome';
import { MerchantHome } from '@/modules/home/MerchantHome';
import { MarketplaceView } from '@/modules/paseoya/MarketplaceView';
import { CartDrawer } from '@/modules/paseoya/CartDrawer';
import { PickupOrderView } from '@/modules/paseoya/PickupOrderView';
import { MerchantPickupView } from '@/modules/paseoya/MerchantPickupView';
import { ClientPointsView } from '@/modules/points/ClientPointsView';
import { MerchantScannerView } from '@/modules/points/MerchantScannerView';
import { MerchantCouponsView } from '@/modules/points/MerchantCouponsView';
import { JarvisChat } from '@/modules/jarvis/JarvisChat';
import { StoreSheet } from '@/modules/directory/StoreSheet';

function CurrentView() {
  const { tab, currentUser } = useApp();
  if (currentUser.role === 'merchant') {
    switch (tab) {
      case 'm-pickups':
        return <MerchantPickupView />;
      case 'm-points':
        return <MerchantScannerView />;
      case 'm-coupons':
        return <MerchantCouponsView />;
      default:
        return <MerchantHome />;
    }
  }
  switch (tab) {
    case 'paseoya':
      return <MarketplaceView />;
    case 'points':
      return <ClientPointsView />;
    case 'jarvis':
      return <JarvisChat />;
    case 'orders':
      return <PickupOrderView />;
    default:
      return <ClientHome />;
  }
}

function Footer() {
  return (
    <footer className="bg-surface pb-28 pt-6 md:pb-8">
      <div className="wrap caption space-y-1.5">
        <p>Prototipo de demostración para el Hackathon Paseo Aranjuez. Productos, precios y horarios son datos de ejemplo.</p>
        <p>Fotografías y directorio de tiendas: paseoaranjuez.com. PaseoPoints es un token ERC-20 en Polygon Amoy (testnet).</p>
        <p className="pt-2">Paseo Aranjuez · Cochabamba, Bolivia</p>
      </div>
    </footer>
  );
}

export default function App() {
  const { tab, currentUser } = useApp();
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <Header />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={`${currentUser.id}-${tab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1"
          >
            <CurrentView />
          </motion.main>
        </AnimatePresence>
        {tab !== 'jarvis' && <Footer />}
        <BottomNav />
        <DemoSwitcher />
        <CartDrawer />
        <StoreSheet />
        <CommandPalette />
        <Toasts />
        <PointsCelebration />
      </div>
    </MotionConfig>
  );
}
