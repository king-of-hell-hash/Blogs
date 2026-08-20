import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { auth, signInWithPopup, googleProvider, signOut, onAuthStateChanged } from './lib/firebase';
import { LogIn, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600 flex items-center">
                <span className="bg-indigo-600 text-white p-1 rounded mr-2">SEO</span>
                Blog Engine
              </span>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-700">{user.displayName || user.email}</span>
                  </div>
                  {user.photoURL && (
                    <img src={user.photoURL} alt="User avatar" className="w-8 h-8 rounded-full border border-slate-200" />
                  )}
                  <button onClick={() => signOut(auth)} className="flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors">
                    <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
                  </button>
                </div>
              ) : (
                <button onClick={() => signInWithPopup(auth, googleProvider)} className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                  <LogIn className="w-4 h-4 mr-2" /> Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <Dashboard user={user} />
    </div>
  );
}

export default App;
