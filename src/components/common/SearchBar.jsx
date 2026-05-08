import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Calendar } from 'lucide-react';

const SearchBar = ({
  onSearch,
  placeholder = 'Search files, users, comments...',
  filters = { types: true, dateRange: true, role: true },
  fileTypes = ['video', 'image', 'audio', 'text'],
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const inputRef = useRef(null);
  const filterRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({
        query: query.trim().toLowerCase(),
        type: selectedType,
        dateFrom,
        dateTo,
        role: selectedRole,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedType, dateFrom, dateTo, selectedRole, onSearch]);

  // Keyboard shortcut: Ctrl/Cmd+K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setShowFilters(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close filters on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearFilters = () => {
    setSelectedType('all');
    setDateFrom('');
    setDateTo('');
    setSelectedRole('all');
    setQuery('');
  };

  const hasActiveFilters = selectedType !== 'all' || dateFrom || dateTo || selectedRole !== 'all';

  return (
    <div className={`w-full ${className}`} role="search">
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-20 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
              aria-label="Search"
            />
            {/* Keyboard shortcut hint */}
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded">
              <span className="text-gray-400">⌘</span>K
            </kbd>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2.5 rounded-lg border transition-all ${
              hasActiveFilters
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            ref={filterRef}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in"
            role="region"
            aria-label="Search filters"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* File type filter */}
              {filters.types && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">File Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-2 bg-gray-950 border border-gray-700 rounded text-gray-300 text-sm focus:border-cyan-500 outline-none"
                    aria-label="Filter by file type"
                  >
                    <option value="all">All Types</option>
                    {fileTypes.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role filter */}
              {filters.role && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">User Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-2 bg-gray-950 border border-gray-700 rounded text-gray-300 text-sm focus:border-cyan-500 outline-none"
                    aria-label="Filter by user role"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                  </select>
                </div>
              )}

              {/* Date range */}
              {filters.dateRange && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full p-2 bg-gray-950 border border-gray-700 rounded text-gray-300 text-sm focus:border-cyan-500 outline-none"
                      aria-label="Filter from date"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full p-2 bg-gray-950 border border-gray-700 rounded text-gray-300 text-sm focus:border-cyan-500 outline-none"
                      aria-label="Filter to date"
                    />
                  </div>
                </>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors"
                  aria-label="Clear all filters"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
