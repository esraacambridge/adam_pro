import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Edit3,
  Gamepad2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  LogOut,
  Moon,
  Package,
  Plus,
  Search,
  Sun,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';

type AdminView = 'login' | 'dashboard';

type FormData = {
  name: string;
  description: string;
  price: string;
  old_price: string;
  platform: string;
  genre: string;
  image_url: string;
  badge: string;
  rating: string;
  is_available: boolean;
  sort_order: string;
};

const emptyForm: FormData = {
  name: '', description: '', price: '', old_price: '', platform: 'PC',
  genre: 'أكشن', image_url: '', badge: '', rating: '4.5', is_available: true, sort_order: '0',
};

const platforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo'];
const genres = ['أكشن', 'مغامرات', 'سباقات', 'استراتيجية', 'رعب', 'رياضة'];

export default function AdminDashboard({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  const [view, setView] = useState<AdminView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setView('dashboard');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setView(session ? 'dashboard' : 'login');
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoggingIn(false);
    if (error) setLoginError(error.message === 'Invalid login credentials' ? 'بيانات الدخول غير صحيحة' : error.message);
  };

  const handleRegister = async () => {
    setLoginError('');
    setLoggingIn(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoggingIn(false);
    if (error) { setLoginError(error.message); return; }
    if (data.user) { await supabase.auth.signInWithPassword({ email, password }); }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (view === 'login') {
    return (
      <div dir="rtl" className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-logo"><Gamepad2 size={28} /></div>
          <h1>لوحة تحكم الأدمن</h1>
          <p>سجّل دخولك لإدارة منتجات المتجر</p>
          {loginError && <div className="admin-error">{loginError}</div>}
          <label>البريد الإلكتروني<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" /></label>
          <label>كلمة المرور<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} /></label>
          <button className="admin-login-button" onClick={handleLogin} disabled={loggingIn || !email || !password}>
            {loggingIn ? <Loader2 size={18} className="spin" /> : <>دخول <ArrowLeft size={17} /></>}
          </button>
          <button className="admin-register-link" onClick={handleRegister} disabled={loggingIn || !email || !password}>
            إنشاء حساب أدمن جديد
          </button>
          <a className="admin-back-link" href="/">العودة للمتجر</a>
        </div>
      </div>
    );
  }

  return <AdminPanel onLogout={handleLogout} theme={theme} onToggleTheme={onToggleTheme} />;
}

function AdminPanel({ onLogout, theme, onToggleTheme }: { onLogout: () => void; theme: string; onToggleTheme: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
    if (error) { console.error(error); }
    else { setProducts(data as Product[]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.platform.toLowerCase().includes(search.toLowerCase()));

  const openNewForm = () => { setEditingProduct(null); setForm(emptyForm); setFormError(''); setShowForm(true); };
  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description, price: String(product.price),
      old_price: product.old_price ? String(product.old_price) : '', platform: product.platform,
      genre: product.genre, image_url: product.image_url, badge: product.badge || '',
      rating: product.rating, is_available: product.is_available, sort_order: String(product.sort_order),
    });
    setFormError(''); setShowForm(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setFormError('');
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) { setFormError('فشل رفع الصورة: ' + uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('اسم المنتج مطلوب'); return; }
    if (!form.description.trim()) { setFormError('وصف المنتج مطلوب'); return; }
    if (!form.price || isNaN(Number(form.price))) { setFormError('السعر يجب أن يكون رقمًا صحيحًا'); return; }
    if (!form.image_url.trim()) { setFormError('صورة المنتج مطلوبة'); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null,
      platform: form.platform,
      genre: form.genre,
      image_url: form.image_url.trim(),
      badge: form.badge.trim() || null,
      rating: form.rating || '4.5',
      is_available: form.is_available,
      sort_order: Number(form.sort_order) || 0,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) setFormError(error.message);
      else { setShowForm(false); fetchProducts(); }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) setFormError(error.message);
      else { setShowForm(false); fetchProducts(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) console.error(error);
    setDeleteId(null);
    fetchProducts();
  };

  const toggleAvailability = async (product: Product) => {
    const { error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    if (error) { console.error(error); return; }
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
  };

  return (
    <div dir="rtl" className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand"><span className="brand-mark"><Gamepad2 size={20} /></span><div><strong>ADAM ATTIA</strong><small>ADMIN PANEL</small></div></div>
          <div className="admin-header-actions">
            <button className="admin-theme-toggle" onClick={onToggleTheme} aria-label="تبديل المظهر">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <a href="/" className="admin-back-store">عرض المتجر</a>
            <button className="admin-logout" onClick={onLogout}><LogOut size={16} /> خروج</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-toolbar">
          <div><h2>إدارة المنتجات</h2><p>{products.length} منتج في المتجر</p></div>
          <div className="admin-toolbar-right">
            <div className="admin-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." /></div>
            <button className="admin-add-btn" onClick={openNewForm}><Plus size={18} /> منتج جديد</button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><Loader2 size={32} className="spin" /> جارٍ تحميل المنتجات...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty"><Package size={40} /><p>لا توجد منتجات</p><span>أضف أول منتج لبدء البيع.</span></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>الصورة</th><th>الاسم</th><th>المنصة</th><th>التصنيف</th><th>السعر</th><th>قبل الخصم</th><th>الحالة</th><th>إجراءات</th></tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td><img src={product.image_url} alt={product.name} className="admin-thumb" /></td>
                    <td className="admin-name-cell"><strong>{product.name}</strong><small>{product.badge}</small></td>
                    <td>{product.platform}</td>
                    <td>{product.genre}</td>
                    <td className="price-cell">{Number(product.price).toFixed(0)} EGP</td>
                    <td className="price-cell">{product.old_price ? `${Number(product.old_price).toFixed(0)} EGP` : '—'}</td>
                    <td><button className={`avail-toggle ${product.is_available ? 'on' : 'off'}`} onClick={() => toggleAvailability(product)}><span className="avail-dot" />{product.is_available ? 'متاح' : 'غير متاح'}</button></td>
                    <td className="admin-actions-cell"><button className="admin-icon-btn edit" onClick={() => openEditForm(product)}><Edit3 size={15} /></button><button className="admin-icon-btn delete" onClick={() => setDeleteId(product.id)}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showForm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-form-modal">
            <div className="admin-form-head">
              <h3>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            {formError && <div className="admin-error">{formError}</div>}
            <div className="admin-form-body">
              <div className="admin-field full">
                <label>صورة المنتج</label>
                <div className="admin-upload-area">
                  {form.image_url ? (
                    <div className="admin-image-preview"><img src={form.image_url} alt="معاينة" /><button className="admin-remove-img" onClick={() => setForm((f) => ({ ...f, image_url: '' }))}><X size={14} /></button></div>
                  ) : (
                    <label className="admin-upload-box">
                      <input type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
                      {uploading ? <><Loader2 size={22} className="spin" /> جارٍ الرفع...</> : <><ImagePlus size={22} /> اضغط لرفع صورة</>}
                    </label>
                  )}
                </div>
                <input className="admin-url-input" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="أو الصق رابط الصورة هنا" />
              </div>
              <div className="admin-field"><label>اسم المنتج</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="اسم اللعبة" /></div>
              <div className="admin-field"><label>المنصة</label><select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}>{platforms.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div className="admin-field"><label>السعر (EGP)</label><input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" /></div>
              <div className="admin-field"><label>السعر قبل الخصم (EGP)</label><input type="number" value={form.old_price} onChange={(e) => setForm((f) => ({ ...f, old_price: e.target.value }))} placeholder="اختياري" /></div>
              <div className="admin-field"><label>التصنيف</label><select value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}>{genres.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
              <div className="admin-field"><label>الشارة (Badge)</label><input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder="مثال: -20% أو جديد" /></div>
              <div className="admin-field"><label>التقييم</label><input value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} placeholder="4.5" /></div>
              <div className="admin-field"><label>الترتيب</label><input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} placeholder="0" /></div>
              <div className="admin-field full"><label>الوصف</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر للعبة" rows={3} /></div>
              <div className="admin-field full"><label className="admin-check"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} /> <span>المنتج متاح للبيع</span></label></div>
            </div>
            <div className="admin-form-foot">
              <button className="admin-cancel-btn" onClick={() => setShowForm(false)}>إلغاء</button>
              <button className="admin-save-btn" onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={17} className="spin" /> : <><Check size={17} /> {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}</>}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="admin-confirm-modal">
            <Trash2 size={32} />
            <h3>حذف المنتج؟</h3>
            <p>سيتم حذف هذا المنتج نهائيًا من المتجر. لا يمكن التراجع.</p>
            <div className="admin-confirm-actions">
              <button className="admin-cancel-btn" onClick={() => setDeleteId(null)}>إلغاء</button>
              <button className="admin-delete-btn" onClick={handleDelete}>نعم، احذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
