import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Headphones,
  Loader2,
  LockKeyhole,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Star,
  Sun,
  Truck,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { supabase, type Product as DbProduct } from '@/lib/supabase';
import { useHashRoute } from '@/lib/useHashRoute';
import { useTheme } from '@/lib/useTheme';
import AdminDashboard from '@/components/AdminDashboard';

type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  platform: string;
  genre: string;
  image: string;
  badge?: string;
  rating: string;
};

type CartItem = StoreProduct & { quantity: number };

const staticImages = {
  controller: 'https://images.pexels.com/photos/14189711/pexels-photo-14189711.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  red: 'https://images.pexels.com/photos/18223728/pexels-photo-18223728.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

const heroImage = '/images/WhatsApp_Image_2026-09-26_at_10.59.08_AM copy.jpeg';

const categories = [
  { name: 'PC Games', detail: 'أكثر من 500 لعبة', icon: '⌘', color: 'blue' },
  { name: 'PlayStation', detail: 'عروض حصرية', icon: '◉', color: 'cyan' },
  { name: 'Xbox', detail: 'شحن فوري', icon: '⊞', color: 'lime' },
  { name: 'Nintendo', detail: 'عالم المرح', icon: '♢', color: 'orange' },
];

function App() {
  const route = useHashRoute();
  const { theme, toggle } = useTheme();

  if (route.startsWith('/admin')) return <AdminDashboard theme={theme} onToggleTheme={toggle} />;

  return <Storefront theme={theme} onToggleTheme={toggle} />;
}

function Storefront({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  const [activeNav, setActiveNav] = useState('الرئيسية');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('الكل');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) { setLoadError('تعذّر تحميل المنتجات. حاول مرة أخرى لاحقًا.'); setProducts([]); }
      else {
        const mapped: StoreProduct[] = (data as DbProduct[]).map((p) => ({
          id: p.id, name: p.name, description: p.description, price: Number(p.price),
          oldPrice: p.old_price ? Number(p.old_price) : undefined, platform: p.platform,
          genre: p.genre, image: p.image_url, badge: p.badge || undefined, rating: p.rating,
        }));
        setProducts(mapped);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || product.genre.includes(search);
    const matchesPlatform = platform === 'الكل' || product.platform === platform;
    return matchesSearch && matchesPlatform;
  }), [platform, search, products]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: StoreProduct) => {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const scrollTo = (id: string, label: string) => {
    setActiveNav(label);
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div dir="rtl" className="app-shell">
      <div className="top-strip"><span><Zap size={14} /> تسليم فوري وآمن لجميع المنتجات الرقمية</span><span className="top-note">شحن مجاني للطلبات فوق 500 EGP</span></div>
      <header className="site-header">
        <div className="container header-inner">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="فتح القائمة"><Menu size={23} /></button>
          <button className="brand" onClick={() => scrollTo('home', 'الرئيسية')} aria-label="Adam Attia Games">
            <span className="brand-mark"><Gamepad2 size={20} /></span>
            <span><strong>ADAM ATTIA</strong><small>GAMES</small></span>
          </button>
          <nav className={`main-nav ${mobileMenu ? 'is-open' : ''}`}>
            {['الرئيسية', 'الألعاب', 'العروض', 'الأكثر مبيعًا', 'تواصل معنا'].map((item) => <button className={activeNav === item ? 'active' : ''} key={item} onClick={() => scrollTo(item === 'الرئيسية' ? 'home' : item === 'تواصل معنا' ? 'footer' : 'catalog', item)}>{item}</button>)}
          </nav>
          <div className="header-actions">
            <button className="icon-button theme-toggle" onClick={onToggleTheme} aria-label="تبديل المظهر">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="icon-button" onClick={() => setAuthOpen(true)} aria-label="الحساب"><UserRound size={19} /></button>
            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="السلة"><ShoppingBag size={19} /><span>السلة</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="hero container">
          <div className="hero-content">
            <div className="eyebrow"><span className="eyebrow-dot" /> متجر اللاعبين الحقيقيين</div>
            <h1>ارفع مستوى<br /><span>اللعب.</span> عش التجربة.</h1>
            <p>كل ما تحتاجه لعالم الألعاب في مكان واحد. مفاتيح أصلية، أسعار مميزة، وتسليم فوري يصلك خلال ثوانٍ.</p>
            <div className="hero-actions"><button className="primary-button" onClick={() => scrollTo('catalog', 'الألعاب')}>تسوق الآن <ArrowLeft size={18} /></button><button className="ghost-button" onClick={() => scrollTo('categories', 'الألعاب')}>استكشف التصنيفات <ArrowDownIcon /></button></div>
            <div className="hero-proof"><div className="avatars"><span>أ</span><span>م</span><span>س</span><span>+</span></div><div><strong>+10,000</strong><small>لاعب يثقون بنا</small></div><div className="proof-divider" /><div><strong>4.9/5</strong><small><Star size={12} fill="currentColor" /> تقييم العملاء</small></div></div>
            <div className="seller-card"><div className="seller-frame"><img src="/images/WhatsApp_Image_2026-09-26_at_10.59.08_AM copy.jpeg" alt="البشمهندس آدم عطية" /></div><div className="seller-info"><span className="seller-name">البشمهندس آدم عطية</span><span className="seller-role"><BadgeCheck size={11} /> مؤسس المتجر · موثّق</span></div></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap"><img src={heroImage} alt="البشمهندس آدم عطية" /><div className="image-shade" /></div>
            <div className="hero-floating-card"><span className="live-dot" /> متصل الآن <strong>1,248</strong> لاعب</div>
            <div className="hero-game-card"><div className="mini-cover" style={{ backgroundImage: `url(${staticImages.red})` }} /><div><small>الأكثر طلبًا هذا الأسبوع</small><strong>The Last Signal</strong><span><Star size={11} fill="currentColor" /> 4.9</span></div><ArrowUpLeft size={18} /></div>
            <div className="hero-line line-one" /><div className="hero-line line-two" />
          </div>
        </section>

        <section className="trust-bar"><div className="container trust-grid"><TrustItem icon={<Truck />} title="تسليم فوري" text="مفتاحك يصلك فورًا" /><TrustItem icon={<LockKeyhole />} title="دفع آمن 100%" text="بياناتك محمية بالكامل" /><TrustItem icon={<BadgeCheck />} title="منتجات أصلية" text="ضمان الجودة والأصالة" /><TrustItem icon={<Headphones />} title="دعم متواصل" text="نحن هنا لمساعدتك" /></div></section>

        <section id="catalog" className="catalog-section container">
          <div className="section-heading"><div><span className="section-kicker">مختارات آدم عطية</span><h2>الألعاب التي <em>تستحق التجربة</em></h2></div><button className="text-button" onClick={() => { setSearch(''); setPlatform('الكل'); }}>عرض كل الألعاب <ArrowLeft size={16} /></button></div>
          <div className="catalog-toolbar"><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن لعبتك المفضلة..." /></div><div className="filter-pills">{['الكل', 'PC', 'PlayStation', 'Xbox', 'Nintendo'].map((item) => <button key={item} className={platform === item ? 'selected' : ''} onClick={() => setPlatform(item)}>{item}</button>)}</div><button className="filter-button"><ChevronDown size={16} /> تصفية متقدمة</button></div>
          {loading ? (
            <div className="store-loading"><Loader2 size={30} className="spin" /> جارٍ تحميل الألعاب...</div>
          ) : loadError ? (
            <div className="store-error"><p>{loadError}</p></div>
          ) : visibleProducts.length === 0 ? (
            <div className="store-empty"><ShoppingBag size={34} /><p>لا توجد ألعاب مطابقة</p><span>جرّب تغيير البحث أو الفلتر.</span></div>
          ) : (
            <div className="product-grid">{visibleProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onOpen={setSelectedProduct} />)}</div>
          )}
        </section>

        <section className="offer-section container"><div className="offer-content"><span className="section-kicker lime-kicker">عرض محدود</span><h2>مستعد للمرحلة<br /><span>التالية؟</span></h2><p>احصل على خصم إضافي 15% على أول طلب لك. استخدم الكود:</p><div className="coupon"><strong>WELCOME15</strong><button onClick={() => navigator.clipboard?.writeText('WELCOME15')}>نسخ الكود</button></div><button className="primary-button" onClick={() => scrollTo('catalog', 'الألعاب')}>استفد من العرض <ArrowLeft size={18} /></button></div><div className="offer-image"><img src={staticImages.controller} alt="وحدة تحكم مضيئة" /><div className="offer-stamp">-15%<small>خصم إضافي</small></div></div></section>

        <section id="categories" className="category-section container"><div className="section-heading"><div><span className="section-kicker">اكتشف عالمك</span><h2>اختر <em>منصتك</em></h2></div><button className="arrow-nav"><ChevronRight size={18} /><ChevronLeft size={18} /></button></div><div className="category-grid">{categories.map((category) => <button className={`category-card ${category.color}`} key={category.name} onClick={() => { setPlatform(category.name.split(' ')[0] === 'PlayStation' ? 'PlayStation' : category.name.split(' ')[0]); scrollTo('catalog', 'الألعاب'); }}><div className="category-symbol">{category.icon}</div><div><h3>{category.name}</h3><span>{category.detail}</span></div><ArrowUpLeft size={19} /></button>)}</div></section>

        <section className="popular-section container"><div className="section-heading"><div><span className="section-kicker">لا تفوّت الفرصة</span><h2>الأكثر <em>مبيعًا</em></h2></div><button className="text-button" onClick={() => scrollTo('catalog', 'الأكثر مبيعًا')}>مشاهدة الكل <ArrowLeft size={16} /></button></div>
          {loading ? (
            <div className="store-loading"><Loader2 size={30} className="spin" /> جارٍ التحميل...</div>
          ) : (
            <div className="product-grid">{products.slice(4).concat(products.slice(0, 2)).slice(0, 4).map((product) => <ProductCard key={`popular-${product.id}`} product={product} onAdd={addToCart} onOpen={setSelectedProduct} />)}</div>
          )}
        </section>

        <section id="footer" className="site-footer"><div className="container footer-grid"><div className="footer-brand"><button className="brand" onClick={() => scrollTo('home', 'الرئيسية')}><span className="brand-mark"><Gamepad2 size={20} /></span><span><strong>ADAM ATTIA</strong><small>GAMES</small></span></button><p>وجهتك الأولى لكل ما يخص عالم الألعاب. العب أكثر، ادفع أقل، واستمتع بلا حدود.</p><div className="socials"><button>𝕏</button><button>◉</button><button>in</button><button>▶</button></div></div><div><h4>روابط سريعة</h4><button onClick={() => scrollTo('catalog', 'الألعاب')}>كل الألعاب</button><button onClick={() => scrollTo('catalog', 'العروض')}>العروض والخصومات</button><button onClick={() => scrollTo('catalog', 'الأكثر مبيعًا')}>الأكثر مبيعًا</button></div><div><h4>خدمة العملاء</h4><button>تواصل معنا</button><button>الأسئلة الشائعة</button><button>سياسة الاسترجاع</button></div><div className="newsletter"><h4>ابقَ على اطلاع</h4><p>اشترك ليصلك كل جديد وعروضنا الحصرية.</p><div className="newsletter-input"><input placeholder="بريدك الإلكتروني" /><button aria-label="اشتراك"><ArrowLeft size={17} /></button></div></div></div><div className="container footer-bottom"><span>© 2024 Adam Attia Games. جميع الحقوق محفوظة.</span><span>صنع بشغف للاعبين <Gamepad2 size={14} /></span></div></section>
      </main>

      {cartOpen && <CartDrawer cart={cart} total={cartTotal} onClose={() => setCartOpen(false)} onChange={setCart} onCheckout={() => { setCartOpen(false); setAuthOpen(true); }} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={() => { addToCart(selectedProduct); setSelectedProduct(null); }} />}
    </div>
  );
}

function ArrowDownIcon() { return <ChevronDown size={16} />; }
function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="trust-item"><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>; }
function ProductCard({ product, onAdd, onOpen }: { product: StoreProduct; onAdd: (product: StoreProduct) => void; onOpen: (product: StoreProduct) => void }) { return <article className="product-card"><button className="product-image" onClick={() => onOpen(product)}><img src={product.image} alt={product.name} />{product.badge && <span className={product.badge.includes('-') ? 'discount-badge' : 'new-badge'}>{product.badge}</span>}<span className="quick-view">عرض التفاصيل <ArrowUpLeft size={14} /></span></button><div className="product-info"><div className="product-meta"><span>{product.platform}</span><span><Star size={12} fill="currentColor" /> {product.rating}</span></div><button className="product-name" onClick={() => onOpen(product)}>{product.name}</button><div className="price-row"><div><strong>{product.price.toFixed(0)} <small>EGP</small></strong>{product.oldPrice && <del>{product.oldPrice.toFixed(0)} EGP</del>}</div><button className="add-button" onClick={() => onAdd(product)} aria-label={`إضافة ${product.name} للسلة`}><ShoppingBag size={17} /></button></div></div></article>; }
function CartDrawer({ cart, total, onClose, onChange, onCheckout }: { cart: CartItem[]; total: number; onClose: () => void; onChange: (cart: CartItem[]) => void; onCheckout: () => void }) { return <div className="overlay"><aside className="cart-drawer"><div className="drawer-head"><div><span className="section-kicker">مشترياتك</span><h3>سلة التسوق <small>({cart.length})</small></h3></div><button onClick={onClose}><X size={20} /></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={38} /><p>سلتك فارغة</p><span>أضف لعبة لتبدأ مغامرتك.</span></div> : <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt={item.name} /><div><strong>{item.name}</strong><small>{item.platform}</small><b>{item.price.toFixed(0)} EGP</b><div className="quantity"><button onClick={() => onChange(item.quantity === 1 ? cart.filter((entry) => entry.id !== item.id) : cart.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry))}>−</button><span>{item.quantity}</span><button onClick={() => onChange(cart.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry))}>+</button></div></div></div>)}</div><div className="cart-summary"><div><span>المجموع الفرعي</span><strong>{total.toFixed(0)} EGP</strong></div><div><span>التوصيل</span><strong className="free">مجاني</strong></div><div className="summary-total"><span>الإجمالي</span><strong>{total.toFixed(0)} <small>EGP</small></strong></div><button className="primary-button full-button" onClick={onCheckout}>الانتقال للدفع <ArrowLeft size={17} /></button></div></>}</aside></div>; }
function AuthModal({ onClose }: { onClose: () => void }) { const [register, setRegister] = useState(false); return <div className="overlay"><div className="auth-modal"><button className="close-modal" onClick={onClose}><X size={19} /></button><span className="auth-icon"><UserRound size={22} /></span><span className="section-kicker">مرحبًا بك في عالمك</span><h3>{register ? 'أنشئ حسابك الآن' : 'سجّل دخولك'}</h3><p>{register ? 'انضم إلى آلاف اللاعبين واحصل على عروض حصرية.' : 'تابع طلباتك واحصل على تجربة تسوق أسرع.'}</p><label>البريد الإلكتروني<input type="email" placeholder="name@example.com" /></label><label>كلمة المرور<input type="password" placeholder="••••••••" /></label><button className="primary-button full-button" onClick={onClose}>{register ? 'إنشاء الحساب' : 'تسجيل الدخول'} <ArrowLeft size={17} /></button><button className="switch-auth" onClick={() => setRegister(!register)}>{register ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ حسابًا'}</button></div></div>; }
function ProductModal({ product, onClose, onAdd }: { product: StoreProduct; onClose: () => void; onAdd: () => void }) { return <div className="overlay"><div className="product-modal"><button className="close-modal" onClick={onClose}><X size={19} /></button><img src={product.image} alt={product.name} /><div className="modal-product-info"><span className="section-kicker">{product.platform} · {product.genre}</span><h3>{product.name}</h3><p>{product.description} استمتع بعالم غني بالتفاصيل، ومغامرة مصممة لتبقى معك طويلًا.</p><div className="modal-rating"><Star size={14} fill="currentColor" /> {product.rating} <span>تقييم اللاعبين</span></div><div className="modal-price"><strong>{product.price.toFixed(0)} <small>EGP</small></strong>{product.oldPrice && <del>{product.oldPrice.toFixed(0)} EGP</del>}</div><button className="primary-button full-button" onClick={onAdd}>أضف إلى السلة <ShoppingBag size={17} /></button></div></div></div>; }

export default App;
