import React, { useState } from 'react';
import { X, Lock, KeyRound, Check, ShieldCheck, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { hasStoredVault, getStoredVaultBlob, decryptVault, encryptVault } from '../services/vaultCrypto';

export default function SaveToVaultModal({
  isOpen,
  onClose,
  initialPassword,
  isVaultUnlocked,
  masterPasswordInMemory,
  unlockedItems,
  onSaveSuccess,
}) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Authentication states if vault is locked
  const hasVault = hasStoredVault();
  const [authMode, setAuthMode] = useState(hasVault ? 'unlock' : 'create');
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerateMasterPw = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
    const array = new Uint32Array(20);
    window.crypto.getRandomValues(array);
    const pw = Array.from(array, (x) => chars[x % chars.length]).join('');
    setMasterPasswordInput(pw);
    setConfirmMasterPassword(pw);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter an account title (e.g., GitHub, Google)');
      return;
    }

    setSaving(true);
    try {
      let masterPw = masterPasswordInMemory;
      let currentItems = unlockedItems ? [...unlockedItems] : [];

      // If vault is locked or doesn't exist yet, we need master password from input
      if (!isVaultUnlocked || !masterPw) {
        if (authMode === 'create' || !hasVault) {
          // Setting up new master password
          if (!masterPasswordInput || masterPasswordInput.length < 6) {
            setError('Master password must be at least 6 characters');
            setSaving(false);
            return;
          }
          if (masterPasswordInput !== confirmMasterPassword) {
            setError('Master passwords do not match');
            setSaving(false);
            return;
          }
          masterPw = masterPasswordInput;
          currentItems = [];
        } else {
          // Unlocking existing vault
          if (!masterPasswordInput) {
            setError('Please enter your Master Password to authorize encryption');
            setSaving(false);
            return;
          }
          const blob = getStoredVaultBlob();
          currentItems = await decryptVault(blob, masterPasswordInput);
          masterPw = masterPasswordInput;
        }
      }

      // Create new credential record
      const newItem = {
        id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        username: username.trim(),
        password: initialPassword,
        website: website.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedItems = [newItem, ...currentItems];

      // Encrypt with AES-256-GCM and persist
      await encryptVault(updatedItems, masterPw);

      setSavedSuccess(true);
      if (onSaveSuccess) {
        onSaveSuccess(updatedItems, masterPw);
      }

      setTimeout(() => {
        setSavedSuccess(false);
        setTitle('');
        setUsername('');
        setWebsite('');
        setNotes('');
        setMasterPasswordInput('');
        setConfirmMasterPassword('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to encrypt and save credential');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Save to Encrypted Vault</h3>
              <p className="text-[11px] text-slate-500">Zero-Knowledge AES-256-GCM Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Password Preview Monospace Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Generated Password to Encrypt
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-indigo-600 select-all truncate">
                {showPassword ? initialPassword : '••••••••••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Account Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GitHub, Google, Amazon, Work Email"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
            />
          </div>

          {/* Username / Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              placeholder="e.g. user@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
            />
          </div>

          {/* Optional URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Website URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="https://github.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
            />
          </div>

          {/* If Vault is Locked: Master Password Prompt */}
          {(!isVaultUnlocked || !masterPasswordInMemory) && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              {/* Segmented Mode Switcher: Unlock vs New User Create */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Vault Authorization
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                  {hasVault && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('unlock'); setError(''); }}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        authMode === 'unlock'
                          ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Unlock
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('create'); setError(''); }}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      authMode === 'create'
                        ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ✨ New User? Create Password
                  </button>
                </div>
              </div>

              {authMode === 'unlock' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Vault is Locked: Enter Master Password</span>
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="Enter your Master Password"
                      value={masterPasswordInput}
                      onChange={(e) => setMasterPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('create'); setError(''); }}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>First time here? Click to create Master Password</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      Create Master Password
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateMasterPw}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                      title="Auto-generate strong password"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Choose Master Password (min 6 chars)"
                      value={masterPasswordInput}
                      onChange={(e) => setMasterPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Confirm Master Password"
                      value={confirmMasterPassword}
                      onChange={(e) => setConfirmMasterPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                    />
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-800 leading-snug">
                    <span className="font-bold">⚠️ Notice:</span> This Master Password can only be created once. There is no reset or recovery if forgotten.
                  </div>
                  {hasVault && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('unlock'); setError(''); }}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 hover:underline cursor-pointer pt-0.5"
                    >
                      Already have a password? Switch to Unlock
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-200 animate-fadeIn">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-semibold">Encrypted & Saved to Vault successfully!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || savedSuccess}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-60"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{saving ? 'Encrypting...' : 'Encrypt & Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
