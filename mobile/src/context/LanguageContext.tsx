import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { 
  Language, 
  translations, 
  TranslationKey, 
  isRTL,
  typeLabelsTranslated,
  formatDate as formatDateUtil,
  formatFullDate as formatFullDateUtil,
} from '../lib/translations';

const LANGUAGE_KEY = 'app_language';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  typeLabels: typeof typeLabelsTranslated.nl;
  formatDate: (dateStr: string | null) => string;
  formatFullDate: (dateStr: string | null) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('nl');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language on startup
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (savedLanguage === 'nl' || savedLanguage === 'ar') {
          setLanguageState(savedLanguage);
          
          // Apply RTL if needed
          const shouldBeRTL = isRTL(savedLanguage);
          if (I18nManager.isRTL !== shouldBeRTL) {
            I18nManager.allowRTL(shouldBeRTL);
            I18nManager.forceRTL(shouldBeRTL);
          }
        }
      } catch (e) {
        console.log('Could not load language setting:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
      setLanguageState(lang);
      
      // Handle RTL change
      const shouldBeRTL = isRTL(lang);
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        // Note: User needs to restart app to apply RTL changes
      }
    } catch (e) {
      console.log('Could not save language setting:', e);
    }
  }, []);

  // Translation function
  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations.nl[key] || key;
  }, [language]);

  // Get type labels for current language
  const typeLabels = typeLabelsTranslated[language];

  // Date formatters for current language
  const formatDate = useCallback((dateStr: string | null) => {
    return formatDateUtil(dateStr, language);
  }, [language]);

  const formatFullDate = useCallback((dateStr: string | null) => {
    return formatFullDateUtil(dateStr, language);
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL: isRTL(language),
    typeLabels,
    formatDate,
    formatFullDate,
  };

  // Don't render until language is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

