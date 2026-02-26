import { Navigation } from './Navigation';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
