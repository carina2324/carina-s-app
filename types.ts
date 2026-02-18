export interface AnalysisResult {
  text: string;
  sources: {
    uri: string;
    title: string;
  }[];
}

export interface WardrobeItem {
  id: string;
  image: string;
  analysis: AnalysisResult;
  timestamp: number;
}

export type AppTab = 'search' | 'feed' | 'wardrobe';
export type AppTheme = 'light' | 'dark';

export interface AppState {
  image: string | null;
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  activeTab: AppTab;
  wardrobe: WardrobeItem[];
  history: string[]; 
  theme: AppTheme;
}