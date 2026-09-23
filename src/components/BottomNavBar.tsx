import { Home, ShoppingCart, User } from 'lucide-react';

export type NavTab = 'home' | 'cart' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  cartCount: number;
  hasProfile: boolean;
}

export default function BottomNavBar({ activeTab, setActiveTab, cartCount, hasProfile }: BottomNavBarProps) {
  return (
    <nav 
      id="bottom-navigation-bar" 
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        {/* Home Tab */}
        <button
          id="nav-tab-home"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors relative cursor-pointer ${
            activeTab === 'home'
              ? 'text-red-600 font-bold'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <Home size={22} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'} />
            {activeTab === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[11px] leading-tight tracking-tight">Home</span>
        </button>

        {/* Cart Section Tab */}
        <button
          id="nav-tab-cart"
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors relative cursor-pointer ${
            activeTab === 'cart'
              ? 'text-red-600 font-bold'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={22} className={activeTab === 'cart' ? 'stroke-[2.5]' : 'stroke-2'} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            {activeTab === 'cart' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[11px] leading-tight tracking-tight">Cart</span>
        </button>

        {/* Profile Section Tab */}
        <button
          id="nav-tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors relative cursor-pointer ${
            activeTab === 'profile'
              ? 'text-red-600 font-bold'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <User size={22} className={activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'} />
            {hasProfile && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
            )}
            {activeTab === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[11px] leading-tight tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
}
