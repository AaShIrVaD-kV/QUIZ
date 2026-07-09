import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div className="search-wrapper">
    <Search className="search-icon" />
    <input
      id="search-input"
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search teams… (press / to focus)"
      className="search-input"
      autoComplete="off"
    />
  </div>
);
