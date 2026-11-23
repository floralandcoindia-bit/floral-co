import Seo from "../components/common/Seo";
import Hero from "../components/home/Hero";
import BestSellers from "../components/home/BestSellers";
import HowItWorks from "../components/home/HowItWorks";
import Reviews from "../components/home/Reviews";
import Footer from "../components/common/Footer";

export default function Home() {
  return (
    <>
      <Seo />
      <div className="relative z-10 bg-forest pb-24">
        <Hero />
        <BestSellers />
        <HowItWorks />
        <Reviews />
      </div>
      <Footer />
    </>
  );
}
