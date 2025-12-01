import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, doc, updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Package, DollarSign, Clock, 
  Send, FileText, History, ArrowLeft, 
  CheckCircle, AlertCircle, ShoppingCart, Truck
} from 'lucide-react';

// --- CONFIGURATION ---
// I have set this to a dummy placeholder so the app loads visually without crashing.
// When you get your REAL keys from the Firebase Console, you will paste them here.
const firebaseConfig = {
  apiKey: "AIzaSyBYsBOaItDqeepFj7UQwHVLiVsFraKL4hw",
  authDomain: "procure-flow-4c77b.firebaseapp.com",
  projectId: "procure-flow-4c77b",
  storageBucket: "procure-flow-4c77b.firebasestorage.app",
  messagingSenderId: "146315945172",
  appId: "1:146315945172:web:bf63c0e3477006bdd18741"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Use a fixed ID for the demo if the environment variable isn't present
const appId = typeof __app_id !== 'undefined' ? __app_id : 'procure-flow-demo';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userRole, setUserRole] = useState('buyer');
  const [requisitions, setRequisitions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Authentication ---
  useEffect(() => {
    // In this local demo mode, we just fake the loading time
    // because the "demo" keys won't actually log us in.
    setTimeout(() => {
      // Fake a logged in user for UI purposes
      setUser({ uid: 'demo-user-123', isAnonymous: true });
      setLoading(false);
      
      // Auto-seed data for the visual demo
      seedData(); 
    }, 1000);
  }, []);

  // --- 2. Data Fetching ---
  // (In a real app, this listens to the database. Here we just use local state for the UI demo)
  
  // --- Actions ---
  const seedData = () => {
    // Since we don't have a real DB connection yet, we set local state directly
    setRequisitions([
      { id: '1', partNumber: 'PN-1044', description: 'Stainless Steel Valve Body', quantity: 50, status: 'Open', category: 'Mechanical' },
      { id: '2', partNumber: 'PN-2099', description: 'Gasket Kit, Neoprene', quantity: 200, status: 'Open', category: 'Consumables' },
      { id: '3', partNumber: 'PN-3500', description: 'Control Module PCB (Rev 3)', quantity: 15, status: 'Open', category: 'Electronics' },
      { id: '4', partNumber: 'PN-4100', description: 'Hydraulic Cylinder, 5000 PSI', quantity: 4, status: 'Open', category: 'Hydraulics' },
      { id: '5', partNumber: 'PN-8822', description: 'M12 x 50mm Hex Bolt, Grade 8', quantity: 1000, status: 'Open', category: 'Fasteners' }
    ]);
  };

  const generateQuoteNumber = () => {
    const date = new Date();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `QT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${random}`;
  };

  const handleSubmitQuote = async (e, part) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Create the quote object locally
    const newQuote = {
      id: Math.random().toString(),
      quoteNumber: generateQuoteNumber(),
      requisitionId: part.id,
      partNumber: part.partNumber,
      description: part.description,
      vendorName: userRole === 'vendor' ? 'Acme Supply Co.' : 'Internal Test Vendor', 
      vendorId: user.uid, 
      price: parseFloat(formData.get('price')),
      leadTime: formData.get('leadTime'),
      notes: formData.get('notes'),
      status: 'Submitted',
      submittedAt: new Date().toISOString()
    };

    // Update local state (Simulation)
    setQuotes(prev => [...prev, newQuote]);
    
    setNotification({
      type: 'success',
      message: `Quote ${newQuote.quoteNumber} submitted! (Demo Mode)`
    });
    setTimeout(() => setNotification(null), 5000);
    e.target.reset();
  };

  // --- Helper Filters ---
  const getQuotesForPart = (partNum) => {
    return quotes.filter(q => {
      const matchPart = q.partNumber === partNum;
      if (!matchPart) return false;
      if (userRole === 'buyer') return true;
      return q.vendorId === user?.uid;
    }).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  };

  const getMyQuotes = () => {
    return quotes.filter(q => q.vendorId === user?.uid)
      .sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  };

  // --- Views ---
  const Navbar = () => (
    <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShoppingCart className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">ProcureFlow</h1>
            <span className="text-xs text-slate-400">Requisition Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 rounded-lg p-1 flex text-sm border border-slate-700">
            <button onClick={() => setUserRole('buyer')} className={`px-4 py-1.5 rounded-md transition font-medium ${userRole === 'buyer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Buyer View</button>
            <button onClick={() => setUserRole('vendor')} className={`px-4 py-1.5 rounded-md transition font-medium ${userRole === 'vendor' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Vendor View</button>
          </div>
          <div className="hidden sm:flex gap-4 text-sm font-medium border-l border-slate-700 pl-4">
            <button onClick={() => setCurrentView('dashboard')} className={`transition ${currentView === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Open Demand</button>
            {userRole === 'vendor' && (
              <button onClick={() => setCurrentView('vendor-portal')} className={`transition ${currentView === 'vendor-portal' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>My Quotes</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const RequisitionCard = ({ item }) => {
    const partQuotes = getQuotesForPart(item.partNumber);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition duration-200 flex flex-col h-full group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-slate-100 text-slate-600 text-xs font-mono font-bold px-2 py-1 rounded border border-slate-200">{item.partNumber}</span>
              <span className="text-xs text-slate-400 font-medium px-2 border-l border-slate-200">{item.category}</span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">{item.description}</h3>
          </div>
        </div>
        <div className="flex items-end justify-between mt-auto pt-6 border-t border-slate-50">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Quantity</p>
            <div className="flex items-center gap-2 text-slate-800"><Package size={20} className="text-blue-500" /><span className="text-2xl font-bold">{item.quantity}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setSelectedPart(item); setCurrentView('part-detail'); }} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition border border-slate-200">Details</button>
            {userRole === 'vendor' && (
              <button onClick={() => { setSelectedPart(item); setCurrentView('part-detail'); }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow">Quote</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PartDetailPage = () => {
    if (!selectedPart) return null;
    const historicalQuotes = getQuotesForPart(selectedPart.partNumber);
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setCurrentView('dashboard')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium"><ArrowLeft size={18} /> Back to Dashboard</button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-50/50 p-8 border-b border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{selectedPart.description}</h2>
            <div className="text-sm text-slate-500 uppercase tracking-wide font-bold mb-1">Quantity Needed: <span className="text-slate-900">{selectedPart.quantity} units</span></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {userRole === 'vendor' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden sticky top-24">
                <div className="bg-blue-600 p-4 text-white"><h3 className="text-lg font-bold flex items-center gap-2"><Send size={18} /> Submit New Quote</h3></div>
                <form onSubmit={(e) => handleSubmitQuote(e, selectedPart)} className="p-6 space-y-5">
                  <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Unit Price ($)</label><input required name="price" type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2" placeholder="0.00" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Lead Time</label><input required name="leadTime" type="text" className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. 14 Days" /></div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Submit Quote</button>
                </form>
              </div>
            </div>
          )}
          <div className={`lg:col-span-${userRole === 'vendor' ? '2' : '3'}`}>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={20} className="text-slate-500"/> {userRole === 'buyer' ? 'Received Quotes' : 'Your Quote History'}</h3>
            {historicalQuotes.length === 0 ? <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl">No quotes yet</div> : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200"><tr><th className="px-6 py-4">Vendor</th><th className="px-6 py-4 text-right">Price</th><th className="px-6 py-4">Lead Time</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {historicalQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-medium">{q.vendorName}</td><td className="px-6 py-4 text-right font-bold text-green-700">${q.price.toFixed(2)}</td><td className="px-6 py-4">{q.leadTime}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const VendorDashboard = () => (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">My Quote History</h2>
      <div className="bg-white rounded-xl shadow border border-slate-200 p-8 text-center text-slate-500">Feature available in full version</div>
    </div>
  );

  if (loading) return <div className="h-screen flex flex-col items-center justify-center text-slate-400 bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div><p>Initializing Portal (Demo)...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Navbar />
      {notification && <div className="fixed top-24 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl bg-emerald-600 text-white animate-bounce-in">{notification.message}</div>}
      <main className="p-4 sm:p-6 lg:p-8">
        {currentView === 'dashboard' && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-8">Open Demand</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{requisitions.map(item => <RequisitionCard key={item.id} item={item} />)}</div>
          </div>
        )}
        {currentView === 'part-detail' && <PartDetailPage />}
        {currentView === 'vendor-portal' && <VendorDashboard />}
      </main>
    </div>
  );
}