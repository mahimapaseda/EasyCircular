import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24 sm:pt-28">{children}</main>
      <Footer />
    </div>
  );
}
