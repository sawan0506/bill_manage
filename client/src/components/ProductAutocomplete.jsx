import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, AlertCircle } from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export const ProductAutocomplete = ({ onSelectProduct, autoFocus = false }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/autocomplete?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.data);
          setIsOpen(res.data.data.length > 0);
          setSelectedIndex(0);
        }
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150); // Fast 150ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (product) => {
    onSelectProduct(product);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-7 h-7" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={t('searchProductPlaceholder')}
          className="w-full pl-14 pr-12 py-4 text-xl font-medium bg-white border-2 border-slate-300 rounded-2xl shadow-sm focus:border-brand-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-medium">
            <span className="animate-spin text-2xl">⏳</span>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <ul
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-slate-300 max-h-96 overflow-y-auto divide-y divide-slate-100"
        >
          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isLowStock = item.stockQuantity <= 5;

            return (
              <li
                key={item._id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-100 border-l-8 border-brand-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">
                      {item.name}
                    </div>
                    <div className="text-base text-slate-600 font-medium">
                      {item.brand && <span className="mr-2 font-semibold text-slate-700">{item.brand}</span>}
                      {item.sizeModel && <span className="mr-2">({item.sizeModel})</span>}
                      <span className="text-slate-400">•</span> Category: {item.category}
                      {item.hsnCode && <span className="ml-2 text-slate-500">HSN: {item.hsnCode}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-2xl font-black text-emerald-700">
                    ₹{item.sellingPrice.toFixed(2)}
                    <span className="text-sm font-normal text-slate-500"> / {item.unit}</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                      isLowStock
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isLowStock && <AlertCircle className="w-4 h-4" />}
                    <span>Stock: {item.stockQuantity} {item.unit}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
