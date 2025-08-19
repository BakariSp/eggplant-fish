export default function Footer() {
  return (
    <footer className="text-white w-full" style={{ background: "#E85E0E" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div>
          <div className="text-2xl font-extrabold">EGGPLANT.FISH</div>
          <p className="mt-4 text-white/90 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam mollis, justo nec porttitor auctor, erat sapien faucibus lectus, vel tempor dolor augue et lectus.
          </p>

          <div className="flex gap-4 mt-6">
            {[
              { label: "f", href: "#" },
              { label: "tw", href: "#" },
              { label: "in", href: "#" },
              { label: "ig", href: "#" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="w-10 h-10 rounded-md border border-white/70 flex items-center justify-center text-sm font-semibold"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 mt-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">Home</h3>
            <ul className="space-y-3 text-white/90">
              <li><a href="#">Product</a></li>
              <li><a href="#">Course</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Log in</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Article</h3>
            <ul className="space-y-3 text-white/90">
              <li><a href="#">New</a></li>
              <li><a href="#">Old</a></li>
              <li><a href="#">Trend</a></li>
              <li><a href="#">Popular</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="text-white/90">CCdoc123@gmail.com</div>
          </div>
        </div>
      </div>
    </footer>
  );
}


