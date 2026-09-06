import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main className="sckoll-subpage"><section className="sckoll-subhero sckoll-subhero-dark"><div className="sckoll-container"><p className="sckoll-sub-eyebrow">Account setup</p><h1>Your Sckoll workspace is next.</h1><p className="sckoll-sub-description">The production authentication provider still needs to be connected. The marketplace experience is ready; account creation will be enabled after the secure credentials are added.</p><div className="sckoll-sub-actions"><Link href="/" className="sckoll-button sckoll-button-acid">Return home</Link><Link href="/how-it-works" className="sckoll-button sckoll-button-outline">See how it works</Link></div></div></section></main>
  );
}
