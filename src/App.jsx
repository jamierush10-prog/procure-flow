import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, orderBy, doc, setDoc, getDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Package, DollarSign, Send, History, ArrowLeft, 
  CheckCircle, AlertCircle, ShoppingCart, LogOut, User, Lock 
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
// ⚠️ IMPORTANT: Paste your keys inside this object!
const firebaseConfig = {
  apiKey: "AIzaSyBYsBOaItDqeepFj7UQwHVLiVsFraKL4hw",
  authDomain: "procure-flow-4c77b.firebaseapp.com",
  projectId: "procure-flow-4c77b",
  storageBucket: "procure-flow-4c77b.firebasestorage.app",
  messagingSenderId: "146315945172",
  appId: "1:146315945172:web:bf63c0e3477006bdd18741"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Collection Names
const REQS_COLLECTION = 'requisitions';
const QUOTES_COLLECTION = 'quotes';
const USERS_COLLECTION = 'users';
const MAIL_COLLECTION = 'mail'; // Collection watched by Firebase Extension

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'buyer' or 'vendor'
  const [loading, setLoading] = useState(true);

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // User is logged in, try to fetch their role from the database
        try {
          const userDoc = await getDoc(doc(db, USERS_COLLECTION, u.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Fallback if role missing (default to vendor)
            setUserRole('vendor'); 
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole('vendor');
        }
        setUser(u);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
      Loading ProcureFlow...
    </div>
  );

  // If no user, show Login Screen
  if (!user) {
    return <AuthScreen />;
  }

  // If user exists, show Main App
  return <MainApp user={user} userRole={userRole} />;
}

// --- LOGIN / SIGNUP SCREEN ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendor'); // Default role for signup
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // 1. Create User in Auth System
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // 2. Save their Role to Firestore
        await setDoc(doc(db, USERS_COLLECTION, uid), {
          email: email,
          role: role,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to ProcureFlow</h1>
          <p className="text-slate-500">{isLogin ? 'Sign in to access your portal' : 'Create an account to get started'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@company.com" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setRole('vendor')} className={`py-2 rounded-lg border text-sm font-medium transition ${role === 'vendor' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  Vendor
                </button>
                <button type="button" onClick={() => setRole('buyer')} className={`py-2 rounded-lg border text-sm font-medium transition ${role === 'buyer' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  Buyer
                </button>
              </div>
            </div>
          )}

          <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md">
            {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline font-medium">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APPLICATION ---
function MainApp({ user, userRole }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [requisitions, setRequisitions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Listen to Requisitions
    const unsubReq = onSnapshot(query(collection(db, REQS_COLLECTION)), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequisitions(items);
      if (items.length === 0) seedDatabase();
    });

    // Listen to Quotes
    const unsubQuotes = onSnapshot(query(collection(db, QUOTES_COLLECTION), orderBy('submittedAt', 'desc')), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuotes(items);
    });

    return () => { unsubReq(); unsubQuotes(); };
  }, []);

  const seedDatabase = async () => {
    const seedItems = [
      { partNumber: 'PN-1044', description: 'Stainless Steel Valve Body', quantity: 50, status: 'Open', category: 'Mechanical' },
      { partNumber: 'PN-2099', description: 'Gasket Kit, Neoprene', quantity: 200, status: 'Open', category: 'Consumables' },
      { partNumber: 'PN-3500', description: 'Control Module PCB (Rev 3)', quantity: 15, status: 'Open', category: 'Electronics' }
    ];
    seedItems.forEach(async (item) => await addDoc(collection(db, REQS_COLLECTION), item));
  };

  const handleSubmitQuote = async (e, part) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const quotePrice = parseFloat(formData.get('price'));
    const quoteLeadTime = formData.get('leadTime');
    const quoteNotes = formData.get('notes');
    
    const newQuote = {
      quoteNumber: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      requisitionId: part.id,
      partNumber: part.partNumber,
      description: part.description,
      vendorName: user.email, // Using email as vendor name
      vendorId: user.uid,
      price: quotePrice,
      leadTime: quoteLeadTime,
      notes: quoteNotes,
      status: 'Submitted',
      submittedAt: new Date().toISOString()
    };

    try {
      // 1. Save the Quote to the database
      await addDoc(collection(db, QUOTES_COLLECTION), newQuote);

      // 2. EMAIL NOTIFICATION: Send to Buyer (Purchasing Dept)
      // This writes to the 'mail' collection which triggers the Firebase Extension
      await addDoc(collection(db, MAIL_COLLECTION), {
        to: ['purchasing@your-company.com'], // Replace with actual buyer email or logic
        message: {
          subject: `New Quote: ${part.partNumber} from ${user.email}`,
          html: `
            <h2>New Quote Received</h2>
            <p><strong>Vendor:</strong> ${user.email}</p>
            <p><strong>Part:</strong> ${part.partNumber} - ${part.description}</p>
            <p><strong>Price:</strong> $${quotePrice.toFixed(2)}</p>
            <p><strong>Lead Time:</strong> ${quoteLeadTime}</p>
            <p><strong>Notes:</strong> ${quoteNotes || 'None'}</p>
            <br />
            <a href="https://procure-flow.vercel.app">Log in to ProcureFlow to view</a>
          `
        }
      });

      // 3. EMAIL CONFIRMATION: Send to Vendor
      await addDoc(collection(db, MAIL_COLLECTION), {
        to: [user.email],
        message: {
          subject: `Quote Submitted: ${part.partNumber}`,
          html: `
            <h2>Quote Confirmation</h2>
            <p>You successfully submitted a quote for <strong>${part.partNumber}</strong>.</p>
            <p><strong>Price:</strong> $${quotePrice.toFixed(2)}</p>
            <p>Thank you for your business.</p>
          `
        }
      });

      setNotification({ type: 'success', message: `Quote ${newQuote.quoteNumber} submitted and emails queued!` });
      setTimeout(() => setNotification(null), 4000);
      e.target.reset();
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to submit quote.' });
    }
  };

  // Helper: Filter logic based on Role
  const visibleQuotes = (partNum) => {
    return quotes.filter(q => {
      if (q.partNumber !== partNum) return false;
      // Buyer sees all; Vendor sees ONLY their own
      return userRole === 'buyer' || q.vendorId === user.uid;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="bg-blue-600 p-2 rounded-lg"><ShoppingCart className="text-white h-5 w-5" /></div>
            <div><h1 className="text-xl font-bold leading-none">ProcureFlow</h1><span className="text-xs text-slate-400">Portal</span></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700 uppercase tracking-wide">{userRole} Account</span>
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"><LogOut size={16} /> Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 mb-6">
        <div className="max-w-7xl mx-auto flex gap-6 px-4">
          <button onClick={() => setCurrentView('dashboard')} className={`py-4 text-sm font-medium border-b-2 transition ${currentView === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Open Demand</button>
          {userRole === 'vendor' && (
            <button onClick={() => setCurrentView('vendor-portal')} className={`py-4 text-sm font-medium border-b-2 transition ${currentView === 'vendor-portal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>My Quotes</button>
          )}
        </div>
      </div>

      {notification && <div className={`fixed top-24 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl text-white animate-bounce-in ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>{notification.message}</div>}

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requisitions.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition flex flex-col group">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2"><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{item.partNumber}</span><span className="text-xs text-slate-400">{item.category}</span></div>
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition">{item.description}</h3>
                </div>
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-50">
                  <div><p className="text-xs text-slate-500 uppercase">Quantity</p><div className="flex items-center gap-1 text-slate-800"><Package size={16} className="text-blue-500" /><span className="text-xl font-bold">{item.quantity}</span></div></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedPart(item); setCurrentView('part-detail'); }} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition border border-slate-200">Details</button>
                    {userRole === 'vendor' && <button onClick={() => { setSelectedPart(item); setCurrentView('part-detail'); }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm">Quote</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentView === 'part-detail' && selectedPart && (
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setCurrentView('dashboard')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium"><ArrowLeft size={18} /> Back</button>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{selectedPart.description}</h2>
              <p className="text-slate-500">Part #: {selectedPart.partNumber} • Qty: {selectedPart.quantity}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {userRole === 'vendor' && (
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 h-fit">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-700"><Send size={18} /> Submit Quote</h3>
                  <form onSubmit={(e) => handleSubmitQuote(e, selectedPart)} className="space-y-4">
                    <div><label className="text-sm font-bold text-slate-700">Price ($)</label><input required name="price" type="number" step="0.01" className="w-full border p-2 rounded" /></div>
                    <div><label className="text-sm font-bold text-slate-700">Lead Time</label><input required name="leadTime" type="text" className="w-full border p-2 rounded" placeholder="e.g. 2 Weeks" /></div>
                    <div><label className="text-sm font-bold text-slate-700">Notes</label><textarea name="notes" className="w-full border p-2 rounded" placeholder="Freight included?"></textarea></div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded">Submit</button>
                  </form>
                </div>
              )}

              <div className={`${userRole === 'vendor' ? '' : 'col-span-2'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><History size={18} /> {userRole === 'buyer' ? 'All Received Quotes' : 'Your History'}</h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {visibleQuotes(selectedPart.partNumber).length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No quotes visible.</div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Lead Time</th></tr></thead>
                      <tbody className="divide-y">
                        {visibleQuotes(selectedPart.partNumber).map(q => (
                          <tr key={q.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{q.vendorName}</td>
                            <td className="px-4 py-3 font-bold text-green-700">${q.price.toFixed(2)}</td>
                            <td className="px-4 py-3">{q.leadTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'vendor-portal' && (
          <div className="max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold mb-6">My Quote History</h2>
             <div className="bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b"><tr><th className="px-6 py-4">Part</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Submitted</th></tr></thead>
                  <tbody className="divide-y">
                     {quotes.filter(q => q.vendorId === user.uid).map(q => (
                       <tr key={q.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-medium">{q.partNumber}</td><td className="px-6 py-4">${q.price.toFixed(2)}</td><td className="px-6 py-4">{new Date(q.submittedAt).toLocaleDateString()}</td></tr>
                     ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}