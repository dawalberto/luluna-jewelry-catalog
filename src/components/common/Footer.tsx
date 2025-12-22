
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t-3 border-black mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-black font-bold uppercase tracking-wide">
          <p className="text-sm">
            © {currentYear} LuLuna Jewelry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
