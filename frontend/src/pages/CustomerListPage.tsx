import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { Search, Plus, User, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface Customer {
    id: number;
    contact_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export default function CustomerListPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    // Debounce logic can be added, for now fetch on effect change with simple delay or submit

    const fetchCustomers = async (searchTerm = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/customers?search=${searchTerm}`);
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchCustomers();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCustomers(search);
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
                    <Link to="/customers/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <Plus className="w-4 h-4" />
                        新規登録
                    </Link>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="名前、会社名で検索..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 border-gray-200"
                        />
                    </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            顧客が見つかりません
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {customers.map((customer) => (
                                <Link
                                    key={customer.id}
                                    to={`/customers/${customer.id}`}
                                    className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                    {customer.contact_name}
                                                    {customer.company_name && (
                                                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            {customer.company_name}
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                    {customer.email && (
                                                        <span>{customer.email}</span>
                                                    )}
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                </div>
                                                {customer.address && (
                                                    <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {customer.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Status or Counts could go here */}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
