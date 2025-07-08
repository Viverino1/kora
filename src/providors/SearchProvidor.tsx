import React, { createContext, useContext, useState } from 'react';

type SearchContextType = {
  isSearchVisible: boolean;
  setSearchVisible: (visible: boolean) => void;
  toggleSearch: () => void;
};

const searchContextDefaults: SearchContextType = {
  isSearchVisible: false,
  setSearchVisible: () => {},
  toggleSearch: () => {}
};

const SearchContext = createContext<SearchContextType>(searchContextDefaults);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  const setSearchVisible = (visible: boolean) => {
    setIsSearchVisible(visible);
  };

  const toggleSearch = () => {
    setIsSearchVisible((prev) => !prev);
  };

  return (
    <SearchContext.Provider value={{ isSearchVisible, setSearchVisible, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
