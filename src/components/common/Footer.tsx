
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          <p className="text-sm">
            © {currentYear} LuLuna Jewelry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
