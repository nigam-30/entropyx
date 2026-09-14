import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Search,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  X,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  hasStoredVault,
  getStoredVaultBlob,
  decryptVault,
  encryptVault,
} from '../services/vaultCrypto';

export default function VaultView({
  isUnlocked,
  items,
  masterPassword,
  onUnlock,
  onLock,
  onUpdateItems,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Unlock / Setup form states
  const hasVault = hasStoredVault();
  const [lockMode, setLockMode] = useState(hasVault ? 'unlock' : 'create');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [showSetupPw, setShowSetupPw] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUsername, setItemUsername] = useState('');
  const [itemPassword, setItemPassword] = useState('');
  const [itemWebsite, setItemWebsite] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Helper to auto-generate a high-entropy 20-character master password
  const handleGenerateMasterPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
    const array = new Uint32Array(20);
    window.crypto.getRandomValues(array);
    const pw = Array.from(array, (x) => chars[x % chars.length]).join('');
    setSetupPassword(pw);
    setSetupConfirm(pw);
    setShowSetupPw(true);
  };

  // Copy helper with feedback
  const handleCopy = async (text, id) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Setup initial vault
  const handleSetupVault = async (e) => {
    e.preventDefault();
    setError('');

    if (!acknowledgedWarning) {
      setError('Please acknowledge the one-time creation warning below before proceeding');
      return;
    }

    if (!setupPassword || setupPassword.length < 6) {
      setError('Master Password must be at least 6 characters long');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setError('Master Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const initialItems = [];
      await encryptVault(initialItems, setupPassword);
      onUnlock(initialItems, setupPassword);
      setSetupPassword('');
      setSetupConfirm('');
    } catch (err) {
      setError(err.message || 'Failed to initialize vault');
    } finally {
      setLoading(false);
    }
  };

  // Unlock existing vault
  const handleUnlockVault = async (e) => {
    e.preventDefault();
    setError('');

    if (!unlockPassword) {
      setError('Please enter your Master Password');
      return;
    }

    setLoading(true);
    try {
      const blob = getStoredVaultBlob();
      const decrypted = await decryptVault(blob, unlockPassword);
      onUnlock(decrypted, unlockPassword);
      setUnlockPassword('');
    } catch (err) {
      setError('Incorrect Master Password or corrupted vault');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new item
  const openAddModal = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemUsername('');
    setItemPassword('');
    setItemWebsite('');
    setItemNotes('');
    setModalOpen(true);
  };

  // Open modal to edit existing item
  const openEditModal = (item) => {
    setEditingItem(item);
    setItemTitle(item.title || '');
    setItemUsername(item.username || '');
    setItemPassword(item.password || '');
    setItemWebsite(item.website || '');
    setItemNotes(item.notes || '');
    setModalOpen(true);
  };

  // Save (create or update) item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemPassword) return;

    setLoading(true);
    try {
      let updatedList;
      if (editingItem) {
        updatedList = items.map((it) =>
          it.id === editingItem.id
            ? {
                ...it,
                title: itemTitle.trim(),
                username: itemUsername.trim(),
                password: itemPassword,
                website: itemWebsite.trim(),
                notes: itemNotes.trim(),
                updatedAt: new Date().toISOString(),
              }
            : it
        );
      } else {
        const newItem = {
          id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          title: itemTitle.trim(),
          username: itemUsername.trim(),
          password: itemPassword,
          website: itemWebsite.trim(),
          notes: itemNotes.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedList = [newItem, ...items];
      }

      await encryptVault(updatedList, masterPassword);
      onUpdateItems(updatedList);
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;
    try {
      const updatedList = items.filter((it) => it.id !== id);
      await encryptVault(updatedList, masterPassword);
      onUpdateItems(updatedList);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Filter items by search
  const filteredItems = (items || []).filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.username && item.username.toLowerCase().includes(q)) ||
      (item.website && item.website.toLowerCase().includes(q))
    );
  });

  // LOCKED STATE (Default when user hasn't unlocked vault)
  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-7 space-y-5 animate-fadeIn">
        {/* Lock Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <span className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-2xs">
              Locked
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-800">Vault is Locked</h2>

          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lockMode === 'unlock'
              ? 'Enter your Master Password to decrypt and access your stored credentials.'
              : 'Create a secure Master Password to initialize and unlock your encrypted vault.'}
          </p>
        </div>

        {/* Segmented Mode Switcher: Unlock Existing vs New User Create */}
        <div className="flex items-center justify-center pt-1">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {hasVault && (
              <button
                type="button"
                onClick={() => { setLockMode('unlock'); setError(''); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  lockMode === 'unlock'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Unlock Existing Vault
              </button>
            )}
            <button
              type="button"
              onClick={() => { setLockMode('create'); setError(''); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                lockMode === 'create'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✨ New User? Create Password
            </button>
          </div>
        </div>

        {/* Form: If lockMode is unlock -> Unlock. If lockMode is create -> Create Master Password */}
        {lockMode === 'unlock' ? (
          <form onSubmit={handleUnlockVault} className="max-w-sm mx-auto space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Master Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter your Master Password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-hidden transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-60"
            >
              <Unlock className="w-4 h-4" />
              <span>{loading ? 'Decrypting AES-256...' : 'Unlock Vault'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setLockMode('create'); setError(''); }}
                className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
              >
                First time using CryptoKey? Create Master Password
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetupVault} className="max-w-sm mx-auto space-y-3.5 pt-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Create Master Password</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateMasterPassword}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  title="Generate a cryptographically secure 20-character password"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Generate</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Master Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSetupPw(!showSetupPw)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    {showSetupPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSetupPw ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showSetupPw ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Minimum 6 characters"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Confirm Master Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showSetupPw ? 'text' : 'password'}
                  required
                  placeholder="Re-type Master Password"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Critical One-Time Warning Box */}
            <div className="p-3.5 bg-rose-50/90 border-2 border-rose-300 rounded-xl text-[11px] text-rose-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>CRITICAL WARNING: One-Time Creation Only</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800">
                This Master Password can be set <strong>ONLY ONE TIME</strong>. There is <strong>NO "Forgot Password" or reset option</strong>. If you forget or lose your Master Password, your vault will be permanently locked and all stored credentials will be <strong>lost forever</strong> with zero chance of recovery.
              </p>
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acknowledgedWarning}
                  onChange={(e) => setAcknowledgedWarning(e.target.checked)}
                  className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-rose-900 leading-snug">
                  I understand that this creation is one-time only and CANNOT be reset or recovered if lost.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acknowledgedWarning}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Unlock className="w-4 h-4" />
              <span>{loading ? 'Initializing Vault...' : 'Set Master Password & Unlock'}</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  // STATE 3: Vault is Unlocked (Full Manager View)
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-7 space-y-4 animate-fadeIn">
      {/* Top Action Bar: Search, New Item, Lock */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts or usernames..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Add new credential"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>

          <button
            onClick={onLock}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs font-medium transition-all cursor-pointer"
            title="Lock Vault and purge memory"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Security Status Ribbon */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 font-mono">
        <span className="flex items-center gap-1 text-teal-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          AES-256-GCM Active
        </span>
        <span>{items.length} {items.length === 1 ? 'Credential' : 'Credentials'} Saved</span>
      </div>

      {/* Credentials List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            {searchTerm ? 'No matching accounts found' : 'Your Vault is empty'}
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            {searchTerm
              ? 'Try searching with a different keyword'
              : 'Save generated passwords directly from the Generator or click "New Item" above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isVisible = Boolean(visiblePasswords[item.id]);
            const isCopiedUser = copiedId === `user_${item.id}`;
            const isCopiedPass = copiedId === `pass_${item.id}`;
            const initial = item.title ? item.title.charAt(0).toUpperCase() : '?';

            return (
              <div
                key={item.id}
                className="group p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs bg-slate-50/50 hover:bg-white transition-all space-y-2"
              >
                {/* Header Row: Initial + Title + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                      {item.website && (
                        <a
                          href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5 truncate"
                        >
                          <span className="truncate">{item.website}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit, Delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Credential"
                    >
                      <span className="text-[11px] font-semibold">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Credential"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Grid: Username & Password with Copy Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
                  {/* Username Row */}
                  <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-lg px-2.5 py-1">
                    <span className="text-slate-600 truncate mr-1" title={item.username || 'No username'}>
                      {item.username || <span className="text-slate-400 font-sans italic">No username</span>}
                    </span>
                    {item.username && (
                      <button
                        onClick={() => handleCopy(item.username, `user_${item.id}`)}
                        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                          isCopiedUser ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={isCopiedUser ? 'Copied Username!' : 'Copy Username'}
                      >
                        {isCopiedUser ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Password Row */}
                  <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-lg px-2.5 py-1">
                    <span className="text-indigo-600 font-bold tracking-wider truncate mr-1">
                      {isVisible ? item.password : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => togglePasswordVisibility(item.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={isVisible ? 'Hide Password' : 'Show Password'}
                      >
                        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleCopy(item.password, `pass_${item.id}`)}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isCopiedPass ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={isCopiedPass ? 'Copied Password!' : 'Copy Password'}
                      >
                        {isCopiedPass ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Credential Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-800">
                {editingItem ? 'Edit Credential' : 'Add New Credential'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account / Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub, Google, Amazon"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. user@gmail.com"
                  value={itemUsername}
                  onChange={(e) => setItemUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password"
                  value={itemPassword}
                  onChange={(e) => setItemPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website URL <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={itemWebsite}
                  onChange={(e) => setItemWebsite(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Encrypting...' : editingItem ? 'Update Item' : 'Encrypt & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
