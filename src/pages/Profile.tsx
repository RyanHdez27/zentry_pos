import { useEffect, useState } from 'react';
import { Camera, Loader2, Save, UserRound } from 'lucide-react';
import { assetUrl, authApi, tokenStorage, type User } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState<User | null>(() => tokenStorage.getUser());
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const data = new FormData();
      data.set('name', name);
      data.set('email', email);
      data.set('phone', phone);
      if (photo) data.set('avatar', photo);
      const response = await authApi.updateProfile(data);
      setUser(response.data);
      tokenStorage.setUser(response.data);
      window.dispatchEvent(new Event('zentry:session-updated'));
      setPhoto(null);
      setPreview(undefined);
      setMessage('Perfil actualizado.');
    } catch (error: any) {
      setMessage(error.message || 'No fue posible guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const avatar = preview || assetUrl(user?.avatar);

  return <div className="mx-auto max-w-3xl space-y-5 p-6">
    <div><h1 className="text-xl font-bold text-slate-900">Mi perfil</h1><p className="mt-1 text-sm text-slate-500">Actualiza tus datos de contacto y foto.</p></div>
    <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-600">
          {avatar ? <img src={avatar} alt="Foto de perfil" className="h-full w-full object-cover" /> : <UserRound size={32} />}
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 transition hover:opacity-100" title="Cambiar foto">
            <Camera size={20} /><input type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); } }} />
          </label>
        </div>
        <div><p className="font-semibold text-slate-800">Foto personal</p><p className="text-sm text-slate-500">JPG o PNG, máximo 2 MB.</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Nombre<input required value={name} onChange={e => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Correo<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Teléfono de contacto<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <div className="text-sm font-medium text-slate-700">Rol<div className="mt-1.5 rounded-xl bg-slate-50 px-3 py-2.5 font-normal capitalize text-slate-600">{user?.role || 'Usuario'}</div></div>
      </div>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <div className="flex justify-end"><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Guardar perfil</button></div>
    </form>
  </div>;
}
