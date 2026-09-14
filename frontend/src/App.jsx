import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PasswordDisplay from './components/PasswordDisplay';
import StrengthMeter from './components/StrengthMeter';
import Controls from './components/Controls';
import VaultView from './components/VaultView';
import SaveToVaultModal from './components/SaveToVaultModal';
import { fetchHealth, generatePassword } from './services/api';

export default function App() {
  const [backendHealth, setBackendHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('generator');

  // Vault Management State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultItems, setVaultItems] = useState([]);
  const [masterPasswordInMemory, setMasterPasswordInMemory] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const [options, setOptions] = useState({
    length: 16,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: true,
  });

  const [result, setResult] = useState({
    password: '',
    entropy: 0,
    strength: 'Strong',
    crackTime: 'Calculating...',
  });

  const [loading, setLoading] = useState(false);

  // Check backend connection
  const checkHealth = useCallback(async () => {
    const health = await fetchHealth();
    if (health) {
      setBackendHealth(health);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Generate password
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generatePassword(options);
      setResult(data);
    } catch (err) {
      console.error('Error generating:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Generate on initial load or option changes
  useEffect(() => {
    handleGenerate();
  }, [options]);

  // Vault lifecycle handlers
  const handleVaultUnlock = (items, masterPw) => {
    setIsVaultUnlocked(true);
    setVaultItems(items);
    setMasterPasswordInMemory(masterPw);
  };

  const handleVaultLock = () => {
    setIsVaultUnlocked(false);
    setVaultItems([]);
    setMasterPasswordInMemory('');
  };

  const handleVaultUpdate = (updatedItems) => {
    setVaultItems(updatedItems);
  };

  const handleSaveSuccess = (updatedItems, masterPw) => {
    setIsVaultUnlocked(true);
    setVaultItems(updatedItems);
    setMasterPasswordInMemory(masterPw);
    // Automatically generate a new password after successful save in the vault
    handleGenerate();
  };

  // Tab switcher with auto-lock guarantee when shifting to generator
  const handleTabChange = (newTab) => {
    if (newTab === 'generator' && isVaultUnlocked) {
      handleVaultLock(); // Auto-lock immediately when leaving the vault
    }
    setActiveTab(newTab);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-2.5 pb-6 sm:px-6 sm:pt-3.5 sm:pb-8">
      <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-3.5">
        {/* Header with Segmented Tab Switcher */}
        <Header
          backendHealth={backendHealth}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          vaultCount={vaultItems.length}
          isVaultUnlocked={isVaultUnlocked}
        />

        {/* View 1: Generator Tab */}
        {activeTab === 'generator' && (
          <main className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-5 sm:p-6 space-y-3.5 sm:space-y-4 animate-fadeIn">
            {/* Monospace Password Display */}
            <PasswordDisplay
              password={result.password}
              loading={loading}
              onRegenerate={handleGenerate}
              onSaveToVault={() => setSaveModalOpen(true)}
            />

            {/* Clean Strength Meter */}
            <StrengthMeter
              entropy={result.entropy}
              strength={result.strength}
              crackTime={result.crackTime}
            />

            <div className="border-t border-slate-100 !mt-3 !mb-0" />

            {/* Controls */}
            <div className="!mt-3">
              <Controls options={options} setOptions={setOptions} />
            </div>
          </main>
        )}

        {/* View 2: Encrypted Vault Tab */}
        {activeTab === 'vault' && (
          <VaultView
            isUnlocked={isVaultUnlocked}
            items={vaultItems}
            masterPassword={masterPasswordInMemory}
            onUnlock={handleVaultUnlock}
            onLock={handleVaultLock}
            onUpdateItems={handleVaultUpdate}
          />
        )}
      </div>

      {/* Save to Vault Dialog (Invoked from Generator) */}
      <SaveToVaultModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        initialPassword={result.password}
        isVaultUnlocked={isVaultUnlocked}
        masterPasswordInMemory={masterPasswordInMemory}
        unlockedItems={vaultItems}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
