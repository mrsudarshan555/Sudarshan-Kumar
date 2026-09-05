import React, { useState } from 'react';
import { DEFAULT_COUNTRIES } from '../../data/defaultData';
import { CountryCodeItem } from '../../types';
import { Search, Globe, Check, ArrowLeft } from 'lucide-react';

interface CountryCodeViewProps {
  selectedDialCode: string;
  onSelectCountry: (country: CountryCodeItem) => void;
  onBack: () => void;
}

export const CountryCodeView: React.FC<CountryCodeViewProps> = ({
  selectedDialCode,
  onSelectCountry,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = DEFAULT_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent text-slate-200">
      
      {/* Header - Liquid Magnifying Glass */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 sticky top-0 bg-black/30 backdrop-blur-3xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <button
          onClick={onBack}
          className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
        </button>
        <div>
          <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Country Code</h2>
          <p className="text-[10px] text-purple-300/70 font-sans">Default: India (+91)</p>
        </div>
      </div>

      {/* Search Input - Magnifying Glass */}
      <div className="p-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-purple-300/70 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country name or code..."
            className="w-full bg-black/40 border border-white/15 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-300/50 outline-none focus:border-purple-400 font-sans shadow-inner backdrop-blur-md"
            autoFocus
          />
        </div>
      </div>

      {/* Country List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredCountries.map((country) => {
          const isSelected = selectedDialCode === country.dialCode;
          return (
            <button
              key={`${country.code}-${country.dialCode}`}
              onClick={() => {
                onSelectCountry(country);
                onBack();
              }}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                  : 'bg-black/30 hover:bg-black/50 border-white/10 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{country.flag}</span>
                <div>
                  <div className="text-xs font-semibold text-white">{country.name}</div>
                  <div className="text-[10px] font-sans text-purple-300/60">{country.code}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-sans text-xs font-bold text-purple-300">{country.dialCode}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-sm">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {filteredCountries.length === 0 && (
          <div className="p-8 text-center text-xs font-sans text-purple-300/60">
            No matching country code found.
          </div>
        )}
      </div>

    </div>
  );
};
