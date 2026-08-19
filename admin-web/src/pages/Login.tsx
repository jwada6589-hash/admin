import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    try {
      setIsLoading(true);
      await onLogin(password);
    } catch {
      setError('كلمة المرور غير صحيحة');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#055C33] text-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">ماركت المرتضى</h1>
          <p className="text-gray-500 font-medium">تسجيل دخول الإدارة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`w-full bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33] transition-colors`}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-bold mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#055C33] hover:bg-[#044727] text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex justify-center items-center"
          >
            {isLoading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
