import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    router.push('/'); 
  };

  return (
    <nav className="bg-gray-800 py-4 text-white text-sm mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="font-bold text-lg">HR Admin</h1>
        <ul className="flex space-x-4">
          {/* Render Logout button if user is authenticated */}
          {status === "authenticated" ? (
            <li>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-white transition-colors"
              >
                Logout
              </button>
            </li>
          ) : (
            <li className="text-gray-500">You are not logged in</li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
