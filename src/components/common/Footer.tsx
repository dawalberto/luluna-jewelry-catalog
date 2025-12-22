
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center text-gray-500 font-body">
          <p className="text-sm">
            © {currentYear} LuLuna Jewelry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
